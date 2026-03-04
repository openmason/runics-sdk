import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadConfig, resolveConfig } from "../config.js";

describe("config", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	describe("loadConfig", () => {
		it("should return default config when no file or env vars exist", () => {
			// Store original values
			const originalUrl = process.env.RUNICS_URL;
			const originalKey = process.env.RUNICS_API_KEY;

			// Delete env vars for this test
			// biome-ignore lint/performance/noDelete: Required for testing environment variable absence
			delete process.env.RUNICS_URL;
			// biome-ignore lint/performance/noDelete: Required for testing environment variable absence
			delete process.env.RUNICS_API_KEY;

			const config = loadConfig();

			// Restore original values
			if (originalUrl !== undefined) process.env.RUNICS_URL = originalUrl;
			if (originalKey !== undefined) process.env.RUNICS_API_KEY = originalKey;

			expect(config.url).toBe("http://localhost:8787");
			expect(config.apiKey).toBeUndefined();
			expect(config.defaultLimit).toBe(5);
			expect(config.defaultMinTrust).toBe(0.0);
		});

		it("should use environment variables", () => {
			process.env.RUNICS_URL = "https://test.example.com";
			process.env.RUNICS_API_KEY = "test-key";

			const config = loadConfig();

			expect(config.url).toBe("https://test.example.com");
			expect(config.apiKey).toBe("test-key");
		});
	});

	describe("resolveConfig", () => {
		it("should override with CLI flags", () => {
			const config = resolveConfig({
				url: "https://cli-override.example.com",
				limit: 10,
			});

			expect(config.url).toBe("https://cli-override.example.com");
			expect(config.defaultLimit).toBe(10);
		});

		it("should prioritize CLI flags over env vars", () => {
			process.env.RUNICS_URL = "https://env.example.com";

			const config = resolveConfig({
				url: "https://cli.example.com",
			});

			expect(config.url).toBe("https://cli.example.com");
		});

		it("should allow partial overrides", () => {
			const config = resolveConfig({
				limit: 20,
			});

			expect(config.defaultLimit).toBe(20);
			expect(config.url).toBe("http://localhost:8787"); // default
		});
	});
});
