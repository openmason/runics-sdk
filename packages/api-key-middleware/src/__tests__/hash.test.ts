import { describe, expect, it } from "vitest";
import { generateApiKey, sha256 } from "../hash.js";

describe("sha256", () => {
	it("produces a 64-char hex string", async () => {
		const hash = await sha256("hello");
		expect(hash).toHaveLength(64);
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it("is deterministic", async () => {
		const a = await sha256("test-key-123");
		const b = await sha256("test-key-123");
		expect(a).toBe(b);
	});

	it("different inputs produce different hashes", async () => {
		const a = await sha256("key-one");
		const b = await sha256("key-two");
		expect(a).not.toBe(b);
	});

	it("matches known SHA-256 value", async () => {
		// SHA-256 of empty string
		const hash = await sha256("");
		expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
	});
});

describe("generateApiKey", () => {
	it("produces a live key with correct format", async () => {
		const { apiKey, keyHash, prefix } = await generateApiKey("live");
		expect(apiKey).toMatch(/^ck_live_[a-z0-9]{40}$/);
		expect(apiKey).toHaveLength(48);
		expect(prefix).toBe(apiKey.slice(0, 12));
		expect(keyHash).toHaveLength(64);
	});

	it("produces a test key with correct format", async () => {
		const { apiKey } = await generateApiKey("test");
		expect(apiKey).toMatch(/^ck_test_[a-z0-9]{40}$/);
		expect(apiKey).toHaveLength(48);
	});

	it("generates unique keys", async () => {
		const a = await generateApiKey("live");
		const b = await generateApiKey("live");
		expect(a.apiKey).not.toBe(b.apiKey);
		expect(a.keyHash).not.toBe(b.keyHash);
	});

	it("hash matches sha256 of the key", async () => {
		const { apiKey, keyHash } = await generateApiKey("live");
		const expected = await sha256(apiKey);
		expect(keyHash).toBe(expected);
	});
});
