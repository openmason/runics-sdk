import { z } from "zod";

// ── Scopes ──

export const API_SCOPES = ["cognium", "runics", "cortex"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

// ── Tenant ──

export const TenantType = z.enum(["internal", "partner", "enterprise"]);
export type TenantType = z.infer<typeof TenantType>;

export const TenantStatus = z.enum(["active", "suspended", "revoked"]);
export type TenantStatus = z.infer<typeof TenantStatus>;

export const TenantPlan = z.enum(["free", "starter", "pro", "enterprise"]);
export type TenantPlan = z.infer<typeof TenantPlan>;

export interface TenantRecord {
	id: string;
	name: string;
	type: TenantType;
	contactEmail: string;
	status: TenantStatus;
	plan: TenantPlan;
	rateLimitRpm: number;
	createdAt: string;
	updatedAt: string;
}

// ── API Key ──

export const KeyType = z.enum(["standard", "read-only", "admin"]);
export type KeyType = z.infer<typeof KeyType>;

export const KeyStatus = z.enum(["active", "rotated", "revoked"]);
export type KeyStatus = z.infer<typeof KeyStatus>;

export interface ApiKeyRecord {
	id: string;
	tenantId: string;
	keyHash: string;
	keyPrefix: string;
	name: string;
	scopes: ApiScope[];
	keyType: KeyType;
	status: KeyStatus;
	expiresAt: string | null;
	lastUsedAt: string | null;
	createdAt: string;
	revokedAt: string | null;
}

// ── KV hot-path metadata ──

export interface ApiKeyMetadata {
	keyId: string;
	tenantId: string;
	tenantName: string;
	tenantStatus: TenantStatus;
	scopes: ApiScope[];
	keyType: KeyType;
	rateLimitRpm: number;
	expiresAt: string | null;
}

// ── Middleware environment bindings ──

export interface ApiKeyEnv {
	API_KEYS: KVNamespace;
	RATE_LIMIT: KVNamespace;
}

// ── Middleware context variables ──

export interface ApiKeyVariables {
	tenantId: string;
	tenantName: string;
	keyType: KeyType;
	keyId: string;
}

// ── Database adapter (injected by consumer) ──

export interface DbAdapter {
	/** Look up API key metadata by SHA-256 hash. Returns null if not found. */
	fetchKeyByHash(keyHash: string): Promise<ApiKeyMetadata | null>;
	/** Update last_used_at timestamp for a key. */
	updateLastUsed(keyId: string): Promise<void>;
}

// ── Rate limit result ──

export interface RateLimitResult {
	allowed: boolean;
	current: number;
	limit: number;
	resetAtMs: number;
}

// ── Key generation result ──

export interface GeneratedKey {
	keyId: string;
	apiKey: string;
	prefix: string;
	keyHash: string;
}

// ── Rotation result ──

export interface RotationResult {
	newKey: GeneratedKey;
	oldKeyId: string;
	gracePeriodHours: number;
	oldExpiresAt: string;
}

// ── Validation schemas for management API ──

export const CreateTenantInput = z.object({
	name: z.string().min(1).max(200),
	contactEmail: z.string().email(),
	type: TenantType.default("partner"),
	plan: TenantPlan.default("free"),
	rateLimitRpm: z.number().int().min(1).max(100_000).default(60),
});
export type CreateTenantInput = z.infer<typeof CreateTenantInput>;

export const CreateKeyInput = z.object({
	tenantId: z.string().min(1),
	name: z.string().min(1).max(200),
	scopes: z.array(z.enum(API_SCOPES)).min(1),
	keyType: KeyType.default("standard"),
	expiresAt: z.string().datetime().optional(),
});
export type CreateKeyInput = z.infer<typeof CreateKeyInput>;
