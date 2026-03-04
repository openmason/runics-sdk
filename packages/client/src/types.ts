import type { z } from "zod";
import type {
	CompositionPartSchema,
	CompositionResultSchema,
	FindSkillResponseSchema,
	GenerationHintsSchema,
	PaginatedSkillListSchema,
	SearchMetaSchema,
	SearchTraceSchema,
	SkillResultSchema,
	SkillSchema,
} from "./schemas.js";

// Inferred types from Zod schemas
export type SkillResult = z.infer<typeof SkillResultSchema>;
export type CompositionPart = z.infer<typeof CompositionPartSchema>;
export type CompositionResult = z.infer<typeof CompositionResultSchema>;
export type SearchTrace = z.infer<typeof SearchTraceSchema>;
export type GenerationHints = z.infer<typeof GenerationHintsSchema>;
export type SearchMeta = z.infer<typeof SearchMetaSchema>;
export type FindSkillResponse = z.infer<typeof FindSkillResponseSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type PaginatedSkillList = z.infer<typeof PaginatedSkillListSchema>;

// Client options
export interface FindSkillOptions {
	limit?: number;
	minTrustScore?: number;
	maxTier?: 1 | 2 | 3;
	executionLayer?: string;
	capabilitiesRequired?: string[];
}

export interface FeedbackParams {
	searchEventId: string;
	skillId: string;
	feedbackType: "click" | "use" | "dismiss" | "explicit_good" | "explicit_bad";
	position: number;
}

export interface ListSkillsOptions {
	cursor?: string;
	limit?: number;
	source?: string;
	sortBy?: "name" | "trust_score" | "created_at";
	sortOrder?: "asc" | "desc";
}

export interface RunicsClientOptions {
	baseUrl?: string;
	tenantId?: string;
	retry?: number;
	retryDelay?: number;
	timeout?: number;
	onRequest?: (context: { request: RequestInit; url: string }) => void;
	onResponse?: (context: { response: Response; url: string }) => void;
}
