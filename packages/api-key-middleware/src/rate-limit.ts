import type { RateLimitResult } from "./types.js";

/**
 * KV-based sliding window rate limiter.
 *
 * Key format: `rate:{keyId}:{minute_timestamp}`
 * TTL: 120 seconds (covers current + next minute for cleanup).
 *
 * Burst limiting uses a separate key: `burst:{keyId}:{second_timestamp}`
 * TTL: 10 seconds.
 */
export class RateLimiter {
	constructor(private kv: KVNamespace) {}

	/** Check and increment the per-minute rate counter. */
	async checkRpm(keyId: string, limitRpm: number): Promise<RateLimitResult> {
		const nowMs = Date.now();
		const minute = Math.floor(nowMs / 60_000);
		const kvKey = `rate:${keyId}:${minute}`;

		const current = Number.parseInt((await this.kv.get(kvKey)) ?? "0", 10);

		if (current >= limitRpm) {
			return {
				allowed: false,
				current,
				limit: limitRpm,
				resetAtMs: (minute + 1) * 60_000,
			};
		}

		// Increment (best-effort — KV is eventually consistent, acceptable for rate limiting)
		await this.kv.put(kvKey, String(current + 1), { expirationTtl: 120 });

		return {
			allowed: true,
			current: current + 1,
			limit: limitRpm,
			resetAtMs: (minute + 1) * 60_000,
		};
	}

	/** Check and increment the per-second burst counter. */
	async checkBurst(keyId: string, limitPerSecond: number): Promise<RateLimitResult> {
		const nowMs = Date.now();
		const second = Math.floor(nowMs / 1_000);
		const kvKey = `burst:${keyId}:${second}`;

		const current = Number.parseInt((await this.kv.get(kvKey)) ?? "0", 10);

		if (current >= limitPerSecond) {
			return {
				allowed: false,
				current,
				limit: limitPerSecond,
				resetAtMs: (second + 1) * 1_000,
			};
		}

		await this.kv.put(kvKey, String(current + 1), { expirationTtl: 10 });

		return {
			allowed: true,
			current: current + 1,
			limit: limitPerSecond,
			resetAtMs: (second + 1) * 1_000,
		};
	}
}

/** Plan → burst limit mapping. */
export const PLAN_BURST_LIMITS: Record<string, number> = {
	free: 10,
	starter: 30,
	pro: 100,
	enterprise: 200,
};
