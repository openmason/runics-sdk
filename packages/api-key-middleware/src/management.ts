import type { z } from "zod";
import { generateApiKey, sha256 } from "./hash.js";
import type {
	ApiKeyMetadata,
	ApiKeyRecord,
	ApiScope,
	GeneratedKey,
	KeyType,
	RotationResult,
	TenantRecord,
} from "./types.js";
import { CreateKeyInput, CreateTenantInput } from "./types.js";

/**
 * Database interface for key management operations.
 * Consumers implement this against their Postgres driver (e.g. @neondatabase/serverless, Drizzle).
 */
export interface ManagementDb {
	// Tenants
	insertTenant(tenant: Omit<TenantRecord, "createdAt" | "updatedAt">): Promise<TenantRecord>;
	getTenant(tenantId: string): Promise<TenantRecord | null>;
	updateTenant(
		tenantId: string,
		fields: Partial<Pick<TenantRecord, "name" | "status" | "plan" | "rateLimitRpm">>,
	): Promise<TenantRecord | null>;

	// API Keys
	insertApiKey(key: Omit<ApiKeyRecord, "lastUsedAt" | "createdAt" | "revokedAt">): Promise<ApiKeyRecord>;
	getApiKeysByTenant(tenantId: string): Promise<ApiKeyRecord[]>;
	getApiKeyById(keyId: string): Promise<ApiKeyRecord | null>;
	updateApiKey(
		keyId: string,
		fields: Partial<Pick<ApiKeyRecord, "status" | "expiresAt" | "revokedAt">>,
	): Promise<ApiKeyRecord | null>;
}

/** Default rate limits per plan. */
export const PLAN_DEFAULTS: Record<string, { rpm: number }> = {
	free: { rpm: 30 },
	starter: { rpm: 120 },
	pro: { rpm: 600 },
	enterprise: { rpm: 10_000 },
};

const DEFAULT_GRACE_PERIOD_HOURS = 24;

/**
 * Key management operations.
 * Used by admin API endpoints and CLI scripts.
 */
export class KeyManager {
	constructor(
		private db: ManagementDb,
		private kvCache: KVNamespace,
	) {}

	// ── Tenants ──

	async createTenant(raw: z.input<typeof CreateTenantInput>): Promise<TenantRecord> {
		const input = CreateTenantInput.parse(raw);
		const id = `tenant_${randomId(12)}`;
		// Use explicit value if provided, otherwise derive from plan
		const rpm = raw.rateLimitRpm ?? PLAN_DEFAULTS[input.plan]?.rpm ?? 60;

		return this.db.insertTenant({
			id,
			name: input.name,
			type: input.type ?? "partner",
			contactEmail: input.contactEmail,
			status: "active",
			plan: input.plan ?? "free",
			rateLimitRpm: rpm,
		});
	}

	async getTenant(tenantId: string): Promise<TenantRecord | null> {
		return this.db.getTenant(tenantId);
	}

	async updateTenant(
		tenantId: string,
		fields: Partial<Pick<TenantRecord, "name" | "status" | "plan" | "rateLimitRpm">>,
	): Promise<TenantRecord | null> {
		const updated = await this.db.updateTenant(tenantId, fields);

		// If status changed, invalidate all cached keys for this tenant
		if (fields.status && updated) {
			await this.invalidateTenantKeys(tenantId);
		}

		return updated;
	}

	// ── API Keys ──

	async createKey(
		raw: z.input<typeof CreateKeyInput>,
	): Promise<{ key: GeneratedKey; record: ApiKeyRecord }> {
		const input = CreateKeyInput.parse(raw);
		const tenant = await this.db.getTenant(input.tenantId);
		if (!tenant) {
			throw new Error(`Tenant "${input.tenantId}" not found`);
		}
		if (tenant.status !== "active") {
			throw new Error(`Tenant "${input.tenantId}" is ${tenant.status}`);
		}

		const { apiKey, keyHash, prefix } = await generateApiKey("live");
		const keyId = `key_${randomId(12)}`;

		const record = await this.db.insertApiKey({
			id: keyId,
			tenantId: input.tenantId,
			keyHash,
			keyPrefix: prefix,
			name: input.name,
			scopes: input.scopes as ApiScope[],
			keyType: (input.keyType ?? "standard") as KeyType,
			status: "active",
			expiresAt: input.expiresAt ?? null,
		});

		return {
			key: { keyId, apiKey, prefix, keyHash },
			record,
		};
	}

	async listKeys(
		tenantId: string,
	): Promise<Omit<ApiKeyRecord, "keyHash">[]> {
		const keys = await this.db.getApiKeysByTenant(tenantId);
		// Never return the hash
		return keys.map(({ keyHash: _, ...rest }) => rest);
	}

	async revokeKey(keyId: string): Promise<ApiKeyRecord | null> {
		const key = await this.db.getApiKeyById(keyId);
		if (!key) return null;

		const updated = await this.db.updateApiKey(keyId, {
			status: "revoked",
			revokedAt: new Date().toISOString(),
		});

		// Invalidate KV cache immediately
		if (key.keyHash) {
			await this.kvCache.delete(`apikey:${key.keyHash}`);
		}

		return updated;
	}

	async rotateKey(
		keyId: string,
		gracePeriodHours = DEFAULT_GRACE_PERIOD_HOURS,
	): Promise<RotationResult | null> {
		const oldKey = await this.db.getApiKeyById(keyId);
		if (!oldKey) return null;
		if (oldKey.status !== "active") {
			throw new Error(`Key "${keyId}" is ${oldKey.status}, cannot rotate`);
		}

		// Create new key with same properties
		const { key: newKey } = await this.createKey({
			tenantId: oldKey.tenantId,
			name: oldKey.name,
			scopes: oldKey.scopes,
			keyType: oldKey.keyType,
			expiresAt: oldKey.expiresAt ?? undefined,
		});

		// Mark old key as rotated with grace period expiry
		const oldExpiresAt = new Date(Date.now() + gracePeriodHours * 3600_000).toISOString();
		await this.db.updateApiKey(keyId, {
			status: "rotated",
			expiresAt: oldExpiresAt,
		});

		// Invalidate old key's KV cache
		await this.kvCache.delete(`apikey:${oldKey.keyHash}`);

		return {
			newKey,
			oldKeyId: keyId,
			gracePeriodHours,
			oldExpiresAt,
		};
	}

	// ── Internal ──

	/**
	 * Build the KV metadata object from a key + tenant.
	 * Used when populating the KV cache from Postgres.
	 */
	static buildMetadata(key: ApiKeyRecord, tenant: TenantRecord): ApiKeyMetadata {
		return {
			keyId: key.id,
			tenantId: tenant.id,
			tenantName: tenant.name,
			tenantStatus: tenant.status,
			scopes: key.scopes,
			keyType: key.keyType,
			rateLimitRpm: tenant.rateLimitRpm,
			expiresAt: key.expiresAt,
		};
	}

	/** Invalidate all cached keys for a tenant (e.g. on tenant suspension). */
	private async invalidateTenantKeys(tenantId: string): Promise<void> {
		const keys = await this.db.getApiKeysByTenant(tenantId);
		await Promise.all(keys.map((k) => this.kvCache.delete(`apikey:${k.keyHash}`)));
	}
}

/** Generate a random alphanumeric ID. */
function randomId(length: number): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => chars[b % chars.length])
		.join("");
}
