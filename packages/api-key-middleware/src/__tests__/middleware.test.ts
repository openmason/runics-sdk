import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sha256 } from "../hash.js";
import { apiKeyAuth } from "../middleware.js";
import type { ApiKeyEnv, ApiKeyMetadata, ApiKeyVariables, DbAdapter } from "../types.js";

// biome-ignore lint/suspicious/noExplicitAny: test helper for untyped JSON
type Json = any;

/** In-memory KV mock. */
function createMockKV(): KVNamespace {
	const store = new Map<string, string>();
	return {
		get: async (key: string, type?: string) => {
			const val = store.get(key);
			if (!val) return null;
			return type === "json" ? JSON.parse(val) : val;
		},
		put: async (key: string, value: string) => {
			store.set(key, value);
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
}

const TEST_API_KEY = "ck_live_abcdefghijklmnopqrstuvwxyz0123456789ab";

const VALID_METADATA: ApiKeyMetadata = {
	keyId: "key_test123",
	tenantId: "tenant_abc",
	tenantName: "Test Corp",
	tenantStatus: "active",
	scopes: ["cognium", "runics"],
	keyType: "standard",
	rateLimitRpm: 100,
	expiresAt: null,
};

function createApp(overrides?: {
	metadata?: ApiKeyMetadata | null;
	dbFetchKey?: DbAdapter["fetchKeyByHash"];
	skipRateLimit?: boolean;
}) {
	const apiKeysKV = createMockKV();
	const rateLimitKV = createMockKV();

	const defaultFetch = async () =>
		overrides?.metadata !== undefined ? overrides.metadata : VALID_METADATA;
	const db: DbAdapter = {
		fetchKeyByHash: overrides?.dbFetchKey ?? defaultFetch,
		updateLastUsed: vi.fn(async () => {}),
	};

	const app = new Hono<{
		Bindings: ApiKeyEnv;
		Variables: ApiKeyVariables;
	}>();

	app.use(
		"/v1/*",
		apiKeyAuth({ scope: "runics", db, skipRateLimit: overrides?.skipRateLimit }),
	);

	app.get("/v1/test", (c) => {
		return c.json({
			tenantId: c.get("tenantId"),
			tenantName: c.get("tenantName"),
			keyType: c.get("keyType"),
			keyId: c.get("keyId"),
		});
	});

	return {
		app,
		apiKeysKV,
		rateLimitKV,
		db,
		fetch: (path: string, init?: RequestInit) => {
			const req = new Request(`http://localhost${path}`, init);
			return app.fetch(req, {
				API_KEYS: apiKeysKV,
				RATE_LIMIT: rateLimitKV,
			} as ApiKeyEnv, {
				waitUntil: () => {},
				passThroughOnException: () => {},
			} as unknown as ExecutionContext);
		},
	};
}

describe("apiKeyAuth middleware", () => {
	it("returns 401 when no Authorization header", async () => {
		const { fetch } = createApp();
		const res = await fetch("/v1/test");
		expect(res.status).toBe(401);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("Missing API key");
	});

	it("returns 401 when Authorization is not Bearer", async () => {
		const { fetch } = createApp();
		const res = await fetch("/v1/test", {
			headers: { Authorization: "Basic abc123" },
		});
		expect(res.status).toBe(401);
	});

	it("returns 401 when Bearer token is empty", async () => {
		const { fetch } = createApp();
		const res = await fetch("/v1/test", {
			headers: { Authorization: "Bearer " },
		});
		expect(res.status).toBe(401);
	});

	it("returns 401 for invalid API key (not in DB)", async () => {
		const { fetch } = createApp({ metadata: null });
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(401);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("Invalid API key");
	});

	it("returns 200 and injects tenant context for valid key", async () => {
		const { fetch } = createApp({ skipRateLimit: true });
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(200);
		const body = (await res.json()) as Json;
		expect(body.tenantId).toBe("tenant_abc");
		expect(body.tenantName).toBe("Test Corp");
		expect(body.keyType).toBe("standard");
		expect(body.keyId).toBe("key_test123");
	});

	it("returns 403 when tenant is suspended", async () => {
		const { fetch } = createApp({
			metadata: { ...VALID_METADATA, tenantStatus: "suspended" },
			skipRateLimit: true,
		});
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(403);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("Tenant suspended");
	});

	it("returns 401 when key is expired", async () => {
		const { fetch } = createApp({
			metadata: {
				...VALID_METADATA,
				expiresAt: new Date(Date.now() - 60_000).toISOString(), // expired 1 min ago
			},
			skipRateLimit: true,
		});
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(401);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("API key expired");
	});

	it("returns 403 when key lacks required scope", async () => {
		const { fetch } = createApp({
			metadata: { ...VALID_METADATA, scopes: ["cognium"] }, // no 'runics'
			skipRateLimit: true,
		});
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(403);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("Key not scoped for runics");
	});

	it("returns 429 when rate limit exceeded", async () => {
		const { fetch } = createApp({
			metadata: { ...VALID_METADATA, rateLimitRpm: 2 },
		});
		const headers = { Authorization: `Bearer ${TEST_API_KEY}` };

		// First two requests pass
		expect((await fetch("/v1/test", { headers })).status).toBe(200);
		expect((await fetch("/v1/test", { headers })).status).toBe(200);

		// Third is rejected
		const res = await fetch("/v1/test", { headers });
		expect(res.status).toBe(429);
		const body = (await res.json()) as Json;
		expect(body.error).toBe("Rate limit exceeded");
		expect(body.limit).toBe(2);
	});

	it("caches metadata in KV on first lookup", async () => {
		const dbFetchKey = vi.fn(async () => VALID_METADATA);
		const { fetch } = createApp({ dbFetchKey, skipRateLimit: true });
		const headers = { Authorization: `Bearer ${TEST_API_KEY}` };

		// First request — DB hit
		await fetch("/v1/test", { headers });
		expect(dbFetchKey).toHaveBeenCalledTimes(1);

		// Second request — KV cache hit, no DB call
		await fetch("/v1/test", { headers });
		expect(dbFetchKey).toHaveBeenCalledTimes(1);
	});

	it("calls updateLastUsed on every request", async () => {
		const { fetch, db } = createApp({ skipRateLimit: true });
		const headers = { Authorization: `Bearer ${TEST_API_KEY}` };
		await fetch("/v1/test", { headers });
		expect(db.updateLastUsed).toHaveBeenCalledWith("key_test123");
	});

	it("allows non-expired keys", async () => {
		const { fetch } = createApp({
			metadata: {
				...VALID_METADATA,
				expiresAt: new Date(Date.now() + 3600_000).toISOString(), // 1 hour from now
			},
			skipRateLimit: true,
		});
		const res = await fetch("/v1/test", {
			headers: { Authorization: `Bearer ${TEST_API_KEY}` },
		});
		expect(res.status).toBe(200);
	});
});
