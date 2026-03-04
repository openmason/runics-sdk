import type { FindSkillResponse } from "runics-client";
import { describe, expect, it, vi } from "vitest";
import { formatTable } from "../../formatters/table.js";

describe("formatTable", () => {
	const mockResponse: FindSkillResponse = {
		results: [
			{
				id: "skill-1",
				name: "Test Skill",
				slug: "test-skill",
				agentSummary: "A test skill",
				trustScore: 0.9,
				executionLayer: "cli",
				capabilitiesRequired: ["filesystem"],
				score: 0.85,
				matchSource: "agent_summary",
				matchText: "test match",
			},
		],
		confidence: "high",
		enriched: true,
		meta: {
			matchSources: ["agent_summary"],
			latencyMs: 100,
			tier: 1,
			cacheHit: false,
			llmInvoked: false,
		},
	};

	it("should format response without trace", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		formatTable(mockResponse);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should format response with trace", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const responseWithTrace: FindSkillResponse = {
			...mockResponse,
			searchTrace: {
				originalQuery: "test query",
				alternateQueries: ["alt query"],
				reasoning: "test reasoning",
			},
		};

		formatTable(responseWithTrace, { showTrace: true });

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should handle empty results", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const emptyResponse: FindSkillResponse = {
			...mockResponse,
			results: [],
		};

		formatTable(emptyResponse);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
