import { createMiddleware } from "hono/factory";
import { sha256 } from "./hash.js";
import { RateLimiter } from "./rate-limit.js";
import type { ApiKeyEnv, ApiKeyMetadata, ApiKeyVariables, ApiScope, DbAdapter } from "./types.js";

/** KV cache TTL for API key metadata (seconds). */
const KV_CACHE_TTL = 300; // 5 minutes

export interface ApiKeyAuthOptions {
	/** The required scope for this route group. */
	scope: ApiScope;
	/** Database adapter for Postgres fallback on KV miss. */
	db: DbAdapter;
	/** Skip rate limiting (useful for internal routes). */
	skipRateLimit?: boolean;
}

/**
 * Hono middleware factory for API key authentication.
 *
 * Validates the Bearer token from the Authorization header, resolves
 * tenant context, checks scopes, and enforces rate limits.
 *
 * Usage:
 * ```ts
 * app.use('/v1/*', apiKeyAuth({ scope: 'runics', db: myDbAdapter }));
 * ```
 */
export function apiKeyAuth(options: ApiKeyAuthOptions) {
	const { scope, db, skipRateLimit = false } = options;

	return createMiddleware<{
		Bindings: ApiKeyEnv;
		Variables: ApiKeyVariables;
	}>(async (c, next) => {
		// 1. Extract key from Authorization header
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Missing API key" }, 401);
		}
		const apiKey = authHeader.slice(7);
		if (!apiKey) {
			return c.json({ error: "Missing API key" }, 401);
		}

		// 2. Hash and lookup in KV
		const keyHash = await sha256(apiKey);
		let metadata = await c.env.API_KEYS.get<ApiKeyMetadata>(`apikey:${keyHash}`, "json");

		// 3. Cache miss → query Postgres via adapter
		if (!metadata) {
			metadata = await db.fetchKeyByHash(keyHash);
			if (metadata) {
				await c.env.API_KEYS.put(`apikey:${keyHash}`, JSON.stringify(metadata), {
					expirationTtl: KV_CACHE_TTL,
				});
			}
		}

		// 4. Validate key exists
		if (!metadata) {
			return c.json({ error: "Invalid API key" }, 401);
		}

		// 5. Validate tenant status
		if (metadata.tenantStatus !== "active") {
			return c.json({ error: "Tenant suspended" }, 403);
		}

		// 6. Validate expiration
		if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
			return c.json({ error: "API key expired" }, 401);
		}

		// 7. Validate scope
		if (!metadata.scopes.includes(scope)) {
			return c.json({ error: `Key not scoped for ${scope}` }, 403);
		}

		// 8. Rate limit
		if (!skipRateLimit) {
			const limiter = new RateLimiter(c.env.RATE_LIMIT);
			const result = await limiter.checkRpm(metadata.keyId, metadata.rateLimitRpm);
			if (!result.allowed) {
				return c.json(
					{
						error: "Rate limit exceeded",
						limit: result.limit,
						resetAt: new Date(result.resetAtMs).toISOString(),
					},
					429,
				);
			}
		}

		// 9. Inject tenant context
		c.set("tenantId", metadata.tenantId);
		c.set("tenantName", metadata.tenantName);
		c.set("keyType", metadata.keyType);
		c.set("keyId", metadata.keyId);

		// 10. Update last_used_at (fire-and-forget, non-blocking)
		c.executionCtx.waitUntil(db.updateLastUsed(metadata.keyId));

		await next();
	});
}
