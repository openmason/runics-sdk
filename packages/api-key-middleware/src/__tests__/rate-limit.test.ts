import { beforeEach, describe, expect, it } from "vitest";
import { RateLimiter } from "../rate-limit.js";

/** In-memory KV mock for testing. */
function createMockKV(): KVNamespace {
	const store = new Map<string, { value: string; expiresAt?: number }>();

	return {
		get: async (key: string) => {
			const entry = store.get(key);
			if (!entry) return null;
			if (entry.expiresAt && Date.now() > entry.expiresAt) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},
		put: async (key: string, value: string, opts?: { expirationTtl?: number }) => {
			store.set(key, {
				value,
				expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined,
			});
		},
		delete: async (key: string) => {
			store.delete(key);
		},
	} as unknown as KVNamespace;
}

describe("RateLimiter", () => {
	let kv: KVNamespace;
	let limiter: RateLimiter;

	beforeEach(() => {
		kv = createMockKV();
		limiter = new RateLimiter(kv);
	});

	describe("checkRpm", () => {
		it("allows first request", async () => {
			const result = await limiter.checkRpm("key-1", 60);
			expect(result.allowed).toBe(true);
			expect(result.current).toBe(1);
			expect(result.limit).toBe(60);
		});

		it("allows up to the limit", async () => {
			for (let i = 0; i < 5; i++) {
				const result = await limiter.checkRpm("key-1", 5);
				expect(result.allowed).toBe(true);
				expect(result.current).toBe(i + 1);
			}
		});

		it("rejects when limit is exceeded", async () => {
			for (let i = 0; i < 3; i++) {
				await limiter.checkRpm("key-1", 3);
			}
			const result = await limiter.checkRpm("key-1", 3);
			expect(result.allowed).toBe(false);
			expect(result.current).toBe(3);
		});

		it("tracks keys independently", async () => {
			for (let i = 0; i < 3; i++) {
				await limiter.checkRpm("key-1", 3);
			}
			// key-2 should still be allowed
			const result = await limiter.checkRpm("key-2", 3);
			expect(result.allowed).toBe(true);
			expect(result.current).toBe(1);
		});

		it("returns reset time at next minute boundary", async () => {
			const result = await limiter.checkRpm("key-1", 60);
			const nextMinute = Math.floor(Date.now() / 60_000 + 1) * 60_000;
			expect(result.resetAtMs).toBe(nextMinute);
		});

		it("limit of 1 blocks after first request", async () => {
			const first = await limiter.checkRpm("key-1", 1);
			expect(first.allowed).toBe(true);
			const second = await limiter.checkRpm("key-1", 1);
			expect(second.allowed).toBe(false);
		});
	});

	describe("checkBurst", () => {
		it("allows first request", async () => {
			const result = await limiter.checkBurst("key-1", 10);
			expect(result.allowed).toBe(true);
			expect(result.current).toBe(1);
		});

		it("rejects when burst limit is exceeded", async () => {
			for (let i = 0; i < 5; i++) {
				await limiter.checkBurst("key-1", 5);
			}
			const result = await limiter.checkBurst("key-1", 5);
			expect(result.allowed).toBe(false);
		});

		it("returns reset time at next second boundary", async () => {
			const result = await limiter.checkBurst("key-1", 10);
			const nextSecond = Math.floor(Date.now() / 1_000 + 1) * 1_000;
			expect(result.resetAtMs).toBe(nextSecond);
		});
	});
});
