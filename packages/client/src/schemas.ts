import { z } from "zod";

// SkillResult schema
export const SkillResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	agentSummary: z.string(),
	trustScore: z.number(),
	executionLayer: z.string(),
	capabilitiesRequired: z.array(z.string()),
	score: z.number(),
	matchSource: z.string(),
	matchText: z.string().optional(),
});

// CompositionPart schema
export const CompositionPartSchema = z.object({
	purpose: z.string(),
	skill: SkillResultSchema.nullable(),
});

// CompositionResult schema
export const CompositionResultSchema = z.object({
	detected: z.boolean(),
	parts: z.array(CompositionPartSchema),
	reasoning: z.string(),
});

// SearchTrace schema
export const SearchTraceSchema = z.object({
	originalQuery: z.string(),
	alternateQueries: z.array(z.string()).optional(),
	terminologyMap: z.record(z.string(), z.string()).optional(),
	reasoning: z.string().optional(),
});

// GenerationHints schema
export const GenerationHintsSchema = z.object({
	intent: z.string(),
	capabilities: z.array(z.string()),
	complexity: z.string(),
});

// SearchMeta schema
export const SearchMetaSchema = z.object({
	matchSources: z.array(z.string()),
	latencyMs: z.number(),
	tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
	cacheHit: z.boolean(),
	llmInvoked: z.boolean(),
});

// FindSkillResponse schema
export const FindSkillResponseSchema = z.object({
	results: z.array(SkillResultSchema),
	confidence: z.enum(["high", "medium", "low", "none"]),
	enriched: z.boolean(),
	composition: CompositionResultSchema.optional(),
	searchTrace: SearchTraceSchema.optional(),
	generationHints: GenerationHintsSchema.optional(),
	meta: SearchMetaSchema,
});

// Skill schema (full skill details)
export const SkillSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	version: z.string(),
	source: z.string(),
	description: z.string(),
	agentSummary: z.string(),
	schemaJson: z.record(z.string(), z.unknown()).nullable(),
	authRequirements: z.record(z.string(), z.unknown()).nullable(),
	installMethod: z.record(z.string(), z.unknown()).nullable(),
	trustScore: z.number(),
	cogniumScanned: z.boolean(),
	cogniumReport: z.record(z.string(), z.unknown()).nullable(),
	capabilitiesRequired: z.array(z.string()),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// PaginatedSkillList schema
export const PaginatedSkillListSchema = z.object({
	skills: z.array(SkillSchema),
	cursor: z.string().nullable(),
	hasMore: z.boolean(),
	total: z.number(),
});
