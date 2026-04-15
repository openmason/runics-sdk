import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "../hash.js";
import { KeyManager } from "../management.js";
import type { ManagementDb } from "../management.js";
import type { ApiKeyRecord, TenantRecord } from "../types.js";

/** In-memory KV mock. */
function createMockKV(): KVNamespace {
	const store = new Map<string, string>();
	return {
		get: async (key: string) => store.get(key) ?? null,
		put: async (key: string, value: string) => {
			store.set(key, value);
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
}

function createMockDb(): ManagementDb & {
	_tenants: Map<string, TenantRecord>;
	_keys: Map<string, ApiKeyRecord>;
} {
	const tenants = new Map<string, TenantRecord>();
	const keys = new Map<string, ApiKeyRecord>();

	return {
		_tenants: tenants,
		_keys: keys,

		insertTenant: async (t) => {
			const record: TenantRecord = {
				...t,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			tenants.set(t.id, record);
			return record;
		},
		getTenant: async (id) => tenants.get(id) ?? null,
		updateTenant: async (id, fields) => {
			const t = tenants.get(id);
			if (!t) return null;
			const updated = { ...t, ...fields, updatedAt: new Date().toISOString() };
			tenants.set(id, updated);
			return updated;
		},

		insertApiKey: async (k) => {
			const record: ApiKeyRecord = {
				...k,
				lastUsedAt: null,
				createdAt: new Date().toISOString(),
				revokedAt: null,
			};
			keys.set(k.id, record);
			return record;
		},
		getApiKeysByTenant: async (tenantId) =>
			[...keys.values()].filter((k) => k.tenantId === tenantId),
		getApiKeyById: async (id) => keys.get(id) ?? null,
		updateApiKey: async (id, fields) => {
			const k = keys.get(id);
			if (!k) return null;
			const updated = { ...k, ...fields };
			keys.set(id, updated);
			return updated;
		},
	};
}

describe("KeyManager", () => {
	let db: ReturnType<typeof createMockDb>;
	let kv: KVNamespace;
	let manager: KeyManager;

	beforeEach(() => {
		db = createMockDb();
		kv = createMockKV();
		manager = new KeyManager(db, kv);
	});

	describe("createTenant", () => {
		it("creates a tenant with defaults", async () => {
			const tenant = await manager.createTenant({
				name: "Acme Corp",
				contactEmail: "api@acme.com",
			});
			expect(tenant.id).toMatch(/^tenant_/);
			expect(tenant.name).toBe("Acme Corp");
			expect(tenant.type).toBe("partner");
			expect(tenant.plan).toBe("free");
			expect(tenant.status).toBe("active");
			expect(tenant.rateLimitRpm).toBe(30); // free plan default
		});

		it("creates a tenant with custom plan and rate limit", async () => {
			const tenant = await manager.createTenant({
				name: "Big Corp",
				contactEmail: "big@corp.com",
				plan: "pro",
				rateLimitRpm: 1000,
			});
			expect(tenant.plan).toBe("pro");
			expect(tenant.rateLimitRpm).toBe(1000);
		});
	});

	describe("createKey", () => {
		it("creates an API key for an active tenant", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});

			const { key, record } = await manager.createKey({
				tenantId: tenant.id,
				name: "Production",
				scopes: ["runics", "cognium"],
			});

			expect(key.apiKey).toMatch(/^ck_live_/);
			expect(key.apiKey).toHaveLength(48);
			expect(key.prefix).toHaveLength(12);
			expect(record.status).toBe("active");
			expect(record.scopes).toEqual(["runics", "cognium"]);
			expect(record.keyType).toBe("standard");
			expect(record.tenantId).toBe(tenant.id);
		});

		it("rejects key creation for nonexistent tenant", async () => {
			await expect(
				manager.createKey({
					tenantId: "tenant_ghost",
					name: "Fail",
					scopes: ["runics"],
				}),
			).rejects.toThrow('Tenant "tenant_ghost" not found');
		});

		it("rejects key creation for suspended tenant", async () => {
			const tenant = await manager.createTenant({
				name: "Suspended",
				contactEmail: "s@s.com",
			});
			await manager.updateTenant(tenant.id, { status: "suspended" });

			await expect(
				manager.createKey({
					tenantId: tenant.id,
					name: "Fail",
					scopes: ["runics"],
				}),
			).rejects.toThrow("suspended");
		});
	});

	describe("listKeys", () => {
		it("returns keys without hash", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			await manager.createKey({
				tenantId: tenant.id,
				name: "Key 1",
				scopes: ["runics"],
			});
			await manager.createKey({
				tenantId: tenant.id,
				name: "Key 2",
				scopes: ["cognium"],
			});

			const keys = await manager.listKeys(tenant.id);
			expect(keys).toHaveLength(2);
			for (const key of keys) {
				expect(key).not.toHaveProperty("keyHash");
			}
		});
	});

	describe("revokeKey", () => {
		it("revokes an active key", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			const { key } = await manager.createKey({
				tenantId: tenant.id,
				name: "To revoke",
				scopes: ["runics"],
			});

			const revoked = await manager.revokeKey(key.keyId);
			expect(revoked?.status).toBe("revoked");
			expect(revoked?.revokedAt).toBeTruthy();
		});

		it("returns null for nonexistent key", async () => {
			const result = await manager.revokeKey("key_ghost");
			expect(result).toBeNull();
		});

		it("invalidates KV cache on revocation", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			const { key } = await manager.createKey({
				tenantId: tenant.id,
				name: "Cached",
				scopes: ["runics"],
			});

			// Populate cache
			await kv.put(`apikey:${key.keyHash}`, JSON.stringify({ keyId: key.keyId }));

			// Revoke
			await manager.revokeKey(key.keyId);

			// Cache should be cleared
			const cached = await kv.get(`apikey:${key.keyHash}`);
			expect(cached).toBeNull();
		});
	});

	describe("rotateKey", () => {
		it("creates new key and marks old as rotated", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			const { key: oldKey } = await manager.createKey({
				tenantId: tenant.id,
				name: "Original",
				scopes: ["runics"],
			});

			const result = await manager.rotateKey(oldKey.keyId, 24);
			expect(result).not.toBeNull();
			expect(result!.newKey.apiKey).toMatch(/^ck_live_/);
			expect(result!.newKey.apiKey).not.toBe(oldKey.apiKey);
			expect(result!.oldKeyId).toBe(oldKey.keyId);
			expect(result!.gracePeriodHours).toBe(24);

			// Old key should be rotated with expiry
			const oldRecord = db._keys.get(oldKey.keyId);
			expect(oldRecord?.status).toBe("rotated");
			expect(oldRecord?.expiresAt).toBeTruthy();
		});

		it("rejects rotation of non-active key", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			const { key } = await manager.createKey({
				tenantId: tenant.id,
				name: "To revoke first",
				scopes: ["runics"],
			});
			await manager.revokeKey(key.keyId);

			await expect(manager.rotateKey(key.keyId)).rejects.toThrow("revoked");
		});

		it("returns null for nonexistent key", async () => {
			const result = await manager.rotateKey("key_ghost");
			expect(result).toBeNull();
		});
	});

	describe("updateTenant", () => {
		it("suspends a tenant and invalidates key cache", async () => {
			const tenant = await manager.createTenant({
				name: "Test",
				contactEmail: "t@t.com",
			});
			const { key } = await manager.createKey({
				tenantId: tenant.id,
				name: "Active key",
				scopes: ["runics"],
			});

			// Populate cache
			await kv.put(`apikey:${key.keyHash}`, JSON.stringify({ keyId: key.keyId }));

			// Suspend
			await manager.updateTenant(tenant.id, { status: "suspended" });

			// Cache should be cleared
			const cached = await kv.get(`apikey:${key.keyHash}`);
			expect(cached).toBeNull();
		});
	});

	describe("buildMetadata", () => {
		it("builds correct metadata from key and tenant", () => {
			const key: ApiKeyRecord = {
				id: "key_1",
				tenantId: "tenant_1",
				keyHash: "abc",
				keyPrefix: "ck_live_abc",
				name: "Test",
				scopes: ["runics", "cognium"],
				keyType: "standard",
				status: "active",
				expiresAt: null,
				lastUsedAt: null,
				createdAt: "2026-01-01T00:00:00Z",
				revokedAt: null,
			};
			const tenant: TenantRecord = {
				id: "tenant_1",
				name: "Acme",
				type: "partner",
				contactEmail: "a@a.com",
				status: "active",
				plan: "starter",
				rateLimitRpm: 120,
				createdAt: "2026-01-01T00:00:00Z",
				updatedAt: "2026-01-01T00:00:00Z",
			};

			const meta = KeyManager.buildMetadata(key, tenant);
			expect(meta.keyId).toBe("key_1");
			expect(meta.tenantId).toBe("tenant_1");
			expect(meta.tenantName).toBe("Acme");
			expect(meta.tenantStatus).toBe("active");
			expect(meta.scopes).toEqual(["runics", "cognium"]);
			expect(meta.rateLimitRpm).toBe(120);
		});
	});
});
