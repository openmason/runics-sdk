import { describe, expect, it } from "vitest";
import {
	CompositionPartSchema,
	CompositionResultSchema,
	FindSkillResponseSchema,
	GenerationHintsSchema,
	PaginatedSkillListSchema,
	SearchMetaSchema,
	SearchTraceSchema,
	SkillResultSchema,
	SkillSchema,
} from "../schemas.js";

describe("SkillResultSchema", () => {
	it("should validate a valid skill result", () => {
		const validSkillResult = {
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
		};

		expect(() => SkillResultSchema.parse(validSkillResult)).not.toThrow();
	});

	it("should fail without required fields", () => {
		const invalidSkillResult = {
			id: "skill-1",
			name: "Test Skill",
		};

		expect(() => SkillResultSchema.parse(invalidSkillResult)).toThrow();
	});

	it("should allow optional matchText", () => {
		const validSkillResult = {
			id: "skill-1",
			name: "Test Skill",
			slug: "test-skill",
			agentSummary: "A test skill",
			trustScore: 0.9,
			executionLayer: "cli",
			capabilitiesRequired: ["filesystem"],
			score: 0.85,
			matchSource: "agent_summary",
		};

		expect(() => SkillResultSchema.parse(validSkillResult)).not.toThrow();
	});
});

describe("CompositionPartSchema", () => {
	it("should validate a composition part with skill", () => {
		const validPart = {
			purpose: "lint code",
			skill: {
				id: "skill-1",
				name: "Linter",
				slug: "linter",
				agentSummary: "Lints code",
				trustScore: 0.9,
				executionLayer: "cli",
				capabilitiesRequired: [],
				score: 0.8,
				matchSource: "name",
			},
		};

		expect(() => CompositionPartSchema.parse(validPart)).not.toThrow();
	});

	it("should allow null skill", () => {
		const validPart = {
			purpose: "unknown task",
			skill: null,
		};

		expect(() => CompositionPartSchema.parse(validPart)).not.toThrow();
	});
});

describe("CompositionResultSchema", () => {
	it("should validate a valid composition result", () => {
		const validComposition = {
			detected: true,
			parts: [
				{
					purpose: "lint",
					skill: null,
				},
			],
			reasoning: "Multi-step task detected",
		};

		expect(() => CompositionResultSchema.parse(validComposition)).not.toThrow();
	});
});

describe("SearchTraceSchema", () => {
	it("should validate with all fields", () => {
		const validTrace = {
			originalQuery: "test query",
			alternateQueries: ["alt query 1", "alt query 2"],
			terminologyMap: { test: "testing" },
			reasoning: "some reasoning",
		};

		expect(() => SearchTraceSchema.parse(validTrace)).not.toThrow();
	});

	it("should validate with only required fields", () => {
		const validTrace = {
			originalQuery: "test query",
		};

		expect(() => SearchTraceSchema.parse(validTrace)).not.toThrow();
	});
});

describe("GenerationHintsSchema", () => {
	it("should validate valid generation hints", () => {
		const validHints = {
			intent: "search",
			capabilities: ["filesystem", "network"],
			complexity: "medium",
		};

		expect(() => GenerationHintsSchema.parse(validHints)).not.toThrow();
	});
});

describe("SearchMetaSchema", () => {
	it("should validate valid search meta", () => {
		const validMeta = {
			matchSources: ["name", "description"],
			latencyMs: 150,
			tier: 1,
			cacheHit: false,
			llmInvoked: true,
		};

		expect(() => SearchMetaSchema.parse(validMeta)).not.toThrow();
	});

	it("should only accept valid tier values", () => {
		const invalidMeta = {
			matchSources: ["name"],
			latencyMs: 150,
			tier: 4,
			cacheHit: false,
			llmInvoked: true,
		};

		expect(() => SearchMetaSchema.parse(invalidMeta)).toThrow();
	});
});

describe("FindSkillResponseSchema", () => {
	it("should validate a valid response", () => {
		const validResponse = {
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

		expect(() => FindSkillResponseSchema.parse(validResponse)).not.toThrow();
	});

	it("should validate with optional fields", () => {
		const validResponse = {
			results: [],
			confidence: "low",
			enriched: false,
			composition: {
				detected: false,
				parts: [],
				reasoning: "single task",
			},
			searchTrace: {
				originalQuery: "test",
			},
			meta: {
				matchSources: [],
				latencyMs: 50,
				tier: 2,
				cacheHit: true,
				llmInvoked: true,
			},
		};

		expect(() => FindSkillResponseSchema.parse(validResponse)).not.toThrow();
	});
});

describe("SkillSchema", () => {
	it("should validate a valid skill", () => {
		const validSkill = {
			id: "skill-1",
			name: "Test Skill",
			slug: "test-skill",
			version: "1.0.0",
			source: "mcp-registry",
			description: "A test skill",
			agentSummary: "Test",
			schemaJson: { input: { type: "string" } },
			authRequirements: null,
			installMethod: { type: "npm" },
			trustScore: 0.9,
			cogniumScanned: true,
			cogniumReport: { safe: true },
			capabilitiesRequired: ["filesystem"],
			executionLayer: "mcp-remote",
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		};

		expect(() => SkillSchema.parse(validSkill)).not.toThrow();
	});
});

describe("PaginatedSkillListSchema", () => {
	it("should validate a valid paginated list", () => {
		const validList = {
			skills: [],
			cursor: null,
			hasMore: false,
			total: 0,
		};

		expect(() => PaginatedSkillListSchema.parse(validList)).not.toThrow();
	});

	it("should validate with cursor", () => {
		const validList = {
			skills: [],
			cursor: "next-page-token",
			hasMore: true,
			total: 100,
		};

		expect(() => PaginatedSkillListSchema.parse(validList)).not.toThrow();
	});
});
