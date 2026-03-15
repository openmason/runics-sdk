import type { z } from "zod";
import type {
	AdminBackfillResultSchema,
	AdminScanResultSchema,
	AncestryNodeSchema,
	AuthorProfileSchema,
	AuthorSkillsResponseSchema,
	CompositionDetailSchema,
	CompositionInputSchema,
	CompositionPartSchema,
	CompositionResultSchema,
	CompositionStepSchema,
	CoOccurrenceResultSchema,
	CopyInputSchema,
	CostBreakdownSchema,
	DependentNodeSchema,
	EvalResultSchema,
	EvalRunResultSchema,
	ExtendInputSchema,
	FailedQuerySchema,
	FindSkillResponseSchema,
	ForkInputSchema,
	ForkNodeSchema,
	ForkResultSchema,
	GenerationHintsSchema,
	IndexSkillInputSchema,
	IndexSkillResultSchema,
	InvocationBatchSchema,
	LatencyPercentilesSchema,
	LeaderboardEntrySchema,
	LeaderboardResponseSchema,
	MatchSourceStatsSchema,
	PaginatedSkillListSchema,
	PublishSkillInputSchema,
	SearchMetaSchema,
	SearchTraceSchema,
	SkillResultSchema,
	SkillSchema,
	StarStatusSchema,
	Tier3PatternSchema,
	TierDistributionSchema,
	UpdateSkillInputSchema,
	UploadBundleResultSchema,
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

// v4 types - Composition
export type CompositionStep = z.infer<typeof CompositionStepSchema>;
export type ForkInput = z.infer<typeof ForkInputSchema>;
export type CopyInput = z.infer<typeof CopyInputSchema>;
export type ExtendInput = z.infer<typeof ExtendInputSchema>;
export type CompositionInput = z.infer<typeof CompositionInputSchema>;
export type ForkResult = z.infer<typeof ForkResultSchema>;
export type CompositionDetail = z.infer<typeof CompositionDetailSchema>;

// v4 types - Lineage
export type AncestryNode = z.infer<typeof AncestryNodeSchema>;
export type ForkNode = z.infer<typeof ForkNodeSchema>;
export type DependentNode = z.infer<typeof DependentNodeSchema>;

// v4 types - Social & Agent Signals
export type InvocationBatch = z.infer<typeof InvocationBatchSchema>;
export type CoOccurrenceResult = z.infer<typeof CoOccurrenceResultSchema>;
export type StarStatus = z.infer<typeof StarStatusSchema>;

// v4 types - Leaderboards
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

// v4 types - Authors
export type AuthorProfile = z.infer<typeof AuthorProfileSchema>;
export type AuthorSkillsResponse = z.infer<typeof AuthorSkillsResponseSchema>;

// v4 types - Skills CRUD
export type PublishSkillInput = z.infer<typeof PublishSkillInputSchema>;
export type UpdateSkillInput = z.infer<typeof UpdateSkillInputSchema>;

// v5 types - Skills
export type IndexSkillInput = z.infer<typeof IndexSkillInputSchema>;
export type IndexSkillResult = z.infer<typeof IndexSkillResultSchema>;
export type UploadBundleResult = z.infer<typeof UploadBundleResultSchema>;

// v5 types - Analytics
export type TierDistribution = z.infer<typeof TierDistributionSchema>;
export type MatchSourceStats = z.infer<typeof MatchSourceStatsSchema>;
export type LatencyPercentiles = z.infer<typeof LatencyPercentilesSchema>;
export type CostBreakdown = z.infer<typeof CostBreakdownSchema>;
export type FailedQuery = z.infer<typeof FailedQuerySchema>;
export type Tier3Pattern = z.infer<typeof Tier3PatternSchema>;

// v5 types - Eval
export type EvalRunResult = z.infer<typeof EvalRunResultSchema>;
export type EvalResult = z.infer<typeof EvalResultSchema>;

// v5 types - Admin
export type AdminScanResult = z.infer<typeof AdminScanResultSchema>;
export type AdminBackfillResult = z.infer<typeof AdminBackfillResultSchema>;

// Client options
export interface FindSkillOptions {
	limit?: number;
	minTrustScore?: number;
	maxTier?: 1 | 2 | 3;
	executionLayer?: string;
	capabilitiesRequired?: string[];
	// v5 fields
	appetite?: "strict" | "cautious" | "balanced" | "adventurous";
	tags?: string[];
	category?: string;
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
