import { beforeEach, describe, expect, it, vi } from "vitest";
import { RunicsClient } from "../client.js";
import {
	RunicsNotFoundError,
	RunicsRateLimitError,
	RunicsServerError,
	RunicsValidationError,
} from "../errors.js";

// Mock ofetch
vi.mock("ofetch", () => ({
	ofetch: vi.fn(),
	FetchError: class FetchError extends Error {
		data: unknown;
		constructor(message: string, data?: unknown) {
			super(message);
			this.data = data;
		}
	},
}));

describe("RunicsClient", () => {
	let client: RunicsClient;

	beforeEach(() => {
		client = new RunicsClient({ baseUrl: "https://api.runics.test" });
		vi.clearAllMocks();
	});

	describe("constructor", () => {
		it("should use default baseUrl", () => {
			const defaultClient = new RunicsClient();
			expect(defaultClient).toBeDefined();
		});

		it("should accept custom options", () => {
			const customClient = new RunicsClient({
				baseUrl: "https://custom.test",
				retry: 5,
				timeout: 5000,
			});
			expect(customClient).toBeDefined();
		});
	});

	describe("findSkill", () => {
		it("should call API with correct parameters", async () => {
			const { ofetch } = await import("ofetch");
			const mockResponse = {
				results: [],
				confidence: "high",
				enriched: true,
				meta: {
					matchSources: ["name"],
					latencyMs: 100,
					tier: 1,
					cacheHit: false,
					llmInvoked: false,
				},
			};

			vi.mocked(ofetch).mockResolvedValue(mockResponse);

			const result = await client.findSkill("test query", { limit: 10 });

			expect(result).toEqual(mockResponse);
			expect(ofetch).toHaveBeenCalledWith(
				"https://api.runics.test/v1/search",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining("test query"),
				}),
			);
		});

		it("should throw RunicsValidationError on invalid response", async () => {
			const { ofetch } = await import("ofetch");
			const invalidResponse = { invalid: "data" };

			vi.mocked(ofetch).mockResolvedValue(invalidResponse);

			await expect(client.findSkill("test")).rejects.toThrow(RunicsValidationError);
		});
	});

	describe("getSkill", () => {
		it("should fetch skill by slug", async () => {
			const { ofetch } = await import("ofetch");
			const mockSkill = {
				id: "skill-1",
				name: "Test Skill",
				slug: "test-skill",
				version: "1.0.0",
				source: "registry",
				description: "Test",
				agentSummary: "Test",
				schemaJson: null,
				authRequirements: null,
				installMethod: null,
				trustScore: 0.9,
				cogniumScanned: false,
				cogniumReport: null,
				capabilitiesRequired: [],
			executionLayer: "mcp-remote",
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};

			vi.mocked(ofetch).mockResolvedValue(mockSkill);

			const result = await client.getSkill("test-skill");

			expect(result).toEqual(mockSkill);
			expect(ofetch).toHaveBeenCalledWith(
				"https://api.runics.test/v1/skills/test-skill",
				expect.objectContaining({
					method: "GET",
				}),
			);
		});
	});

	describe("submitFeedback", () => {
		it("should not throw on success", async () => {
			const { ofetch } = await import("ofetch");
			vi.mocked(ofetch).mockResolvedValue(undefined);

			await expect(
				client.submitFeedback({
					searchEventId: "event-1",
					skillId: "skill-1",
					feedbackType: "click",
					position: 0,
				}),
			).resolves.toBeUndefined();
		});

		it("should not throw on failure (fire-and-forget)", async () => {
			const { ofetch } = await import("ofetch");
			vi.mocked(ofetch).mockRejectedValue(new Error("Network error"));

			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			await expect(
				client.submitFeedback({
					searchEventId: "event-1",
					skillId: "skill-1",
					feedbackType: "use",
					position: 1,
				}),
			).resolves.toBeUndefined();

			expect(consoleWarnSpy).toHaveBeenCalled();
			consoleWarnSpy.mockRestore();
		});
	});

	describe("listSkills", () => {
		it("should fetch paginated skills", async () => {
			const { ofetch } = await import("ofetch");
			const mockList = {
				skills: [],
				cursor: null,
				hasMore: false,
				total: 0,
			};

			vi.mocked(ofetch).mockResolvedValue(mockList);

			const result = await client.listSkills({ limit: 20 });

			expect(result).toEqual(mockList);
			expect(ofetch).toHaveBeenCalledWith(
				expect.stringContaining("/v1/skills"),
				expect.objectContaining({
					method: "GET",
				}),
			);
		});
	});

	describe("health", () => {
		it("should fetch health status", async () => {
			const { ofetch } = await import("ofetch");
			const mockHealth = { status: "ok" };

			vi.mocked(ofetch).mockResolvedValue(mockHealth);

			const result = await client.health();

			expect(result).toEqual(mockHealth);
			expect(ofetch).toHaveBeenCalledWith(
				"https://api.runics.test/health",
				expect.objectContaining({
					method: "GET",
				}),
			);
		});
	});

	describe("error handling", () => {
		it("should throw RunicsNotFoundError on 404", async () => {
			const { ofetch } = await import("ofetch");

			vi.mocked(ofetch).mockImplementation(async (url, options) => {
				const error = new Error("Not found");
				if (options?.onResponseError) {
					options.onResponseError({
						request: new Request(url as string),
						response: {
							status: 404,
							headers: new Headers(),
							_data: { message: "Not found" },
						} as Response,
						options: {},
					});
				}
				throw error;
			});

			await expect(client.getSkill("nonexistent")).rejects.toThrow(RunicsNotFoundError);
		});

		it("should throw RunicsRateLimitError on 429", async () => {
			const { ofetch } = await import("ofetch");

			vi.mocked(ofetch).mockImplementation(async (url, options) => {
				const headers = new Headers();
				headers.set("Retry-After", "60");

				if (options?.onResponseError) {
					options.onResponseError({
						request: new Request(url as string),
						response: {
							status: 429,
							headers,
							_data: { message: "Rate limited" },
						} as Response,
						options: {},
					});
				}
				throw new Error("Rate limited");
			});

			try {
				await client.findSkill("test");
			} catch (error) {
				expect(error).toBeInstanceOf(RunicsRateLimitError);
				if (error instanceof RunicsRateLimitError) {
					expect(error.retryAfter).toBe(60);
				}
			}
		});

		it("should throw RunicsServerError on 5xx", async () => {
			const { ofetch } = await import("ofetch");

			vi.mocked(ofetch).mockImplementation(async (url, options) => {
				if (options?.onResponseError) {
					options.onResponseError({
						request: new Request(url as string),
						response: {
							status: 500,
							headers: new Headers(),
							_data: { message: "Internal server error" },
						} as Response,
						options: {},
					});
				}
				throw new Error("Server error");
			});

			await expect(client.findSkill("test")).rejects.toThrow(RunicsServerError);
		});
	});
});
