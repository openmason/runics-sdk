import { z } from "zod";

// SkillResult schema
export const SkillResultSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	agentSummary: z.string().nullable(),
	trustScore: z.number(),
	executionLayer: z.string(),
	capabilitiesRequired: z.array(z.string()),
	score: z.number(),
	matchSource: z.string(),
	matchText: z.string().optional(),
	// v4 fields
	type: z.enum(["skill", "composition", "pipeline"]).optional(),
	status: z
		.enum([
			"published",
			"deprecated",
			"archived",
			"vulnerable",
			"revoked",
			"degraded",
			"contains-vulnerable",
		])
		.optional(),
	replacementSkillId: z.string().optional(),
	replacementSlug: z.string().optional(),
	authorHandle: z.string().optional(),
	authorType: z.enum(["human", "bot", "org"]).optional(),
	forkOf: z.string().optional(),
	forkDepth: z.number().optional(),
	humanStarCount: z.number().optional(),
	humanForkCount: z.number().optional(),
	agentInvocationCount: z.number().optional(),
	compositionInclusionCount: z.number().optional(),
	avgExecutionTimeMs: z.number().optional(),
	errorRate: z.number().optional(),
	tags: z.array(z.string()).optional(),
	cooccursWith: z
		.array(
			z.object({
				skillId: z.string(),
				slug: z.string(),
				compositionCount: z.number(),
			}),
		)
		.optional(),
	// v5 fields
	verificationTier: z
		.enum(["unverified", "scanned", "verified", "certified"])
		.optional(),
	trustBadge: z
		.enum(["human-verified", "auto-distilled", "upstream"])
		.nullable()
		.optional(),
	skillType: z
		.enum(["atomic", "auto-composite", "human-composite", "forked"])
		.optional(),
	forkedFrom: z.string().optional(),
	runCount: z.number().optional(),
	lastRunAt: z.string().optional(),
	revokedReason: z.string().optional(),
	remediationMessage: z.string().optional(),
	remediationUrl: z.string().optional(),
	// v5.2 fields
	runtimeEnv: z.enum(["llm", "api", "browser", "vm", "local"]).optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
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
	degraded: z.boolean().optional(),
	reranked: z.boolean().optional(),
});

// FindSkillResponse schema
export const FindSkillResponseSchema = z.object({
	results: z.array(SkillResultSchema),
	confidence: z.enum(["high", "medium", "low", "low_enriched", "none", "no_match"]),
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
	executionLayer: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	// v4 fields
	type: z.enum(["skill", "composition", "pipeline"]).optional(),
	status: z
		.enum([
			"published",
			"deprecated",
			"archived",
			"draft",
			"vulnerable",
			"revoked",
			"degraded",
			"contains-vulnerable",
		])
		.optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	authorHandle: z.string().optional(),
	authorType: z.enum(["human", "bot", "org"]).optional(),
	forkOf: z.string().optional(),
	forkDepth: z.number().optional(),
	humanStarCount: z.number().optional(),
	humanForkCount: z.number().optional(),
	botForkCount: z.number().optional(),
	humanCopyCount: z.number().optional(),
	agentInvocationCount: z.number().optional(),
	compositionInclusionCount: z.number().optional(),
	avgExecutionTimeMs: z.number().optional(),
	errorRate: z.number().optional(),
	replacementSkillId: z.string().optional(),
	// v5 fields
	verificationTier: z
		.enum(["unverified", "scanned", "verified", "certified"])
		.optional(),
	trustBadge: z
		.enum(["human-verified", "auto-distilled", "upstream"])
		.nullable()
		.optional(),
	skillType: z
		.enum(["atomic", "auto-composite", "human-composite", "forked"])
		.optional(),
	forkedFrom: z.string().optional(),
	runCount: z.number().optional(),
	lastRunAt: z.string().optional(),
	revokedReason: z.string().optional(),
	remediationMessage: z.string().optional(),
	remediationUrl: z.string().optional(),
	// v5.2 fields
	runtimeEnv: z.enum(["llm", "api", "browser", "vm", "local"]).optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
	environmentVariables: z.array(z.string()).optional(),
	shareUrl: z.string().optional(),
	// v5.4 fields
	workflowDefinition: z.record(z.string(), z.unknown()).nullable().optional(),
});

// PaginatedSkillList schema
export const PaginatedSkillListSchema = z.object({
	skills: z.array(SkillSchema),
	cursor: z.string().nullable(),
	hasMore: z.boolean(),
	total: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Composition Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const CompositionStepSchema = z.object({
	skillId: z.string(),
	stepName: z.string().optional(),
	inputMapping: z.record(z.string(), z.string()).optional(),
	onError: z.enum(["fail", "skip", "retry"]).optional(),
});

export const ForkInputSchema = z.object({
	authorId: z.string(),
	authorType: z.enum(["human", "bot"]),
});

export const CopyInputSchema = z.object({
	authorId: z.string(),
	authorType: z.enum(["human", "bot"]),
});

export const ExtendInputSchema = z.object({
	authorId: z.string(),
	authorType: z.enum(["human", "bot"]),
	steps: z.array(CompositionStepSchema).min(1).max(50),
});

export const CompositionInputSchema = z.object({
	name: z.string().min(1).max(200),
	slug: z.string().optional(),
	description: z.string().min(10).max(2000),
	tags: z.array(z.string()).optional(),
	authorId: z.string(),
	authorType: z.enum(["human", "bot"]),
	steps: z.array(CompositionStepSchema).min(2).max(50),
});

export const ForkResultSchema = z.object({
	id: z.string(),
	slug: z.string(),
});

export const CompositionDetailSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	type: z.enum(["composition", "pipeline"]),
	status: z.enum(["draft", "published", "deprecated", "archived"]),
	description: z.string(),
	trust_score: z.number(),
	steps: z.array(
		z.object({
			id: z.string(),
			stepOrder: z.number(),
			skillId: z.string(),
			skillName: z.string(),
			skillSlug: z.string(),
			stepName: z.string().nullable(),
			inputMapping: z.record(z.string(), z.string()).nullable(),
			onError: z.enum(["fail", "skip", "retry"]),
		}),
	),
});

// ──────────────────────────────────────────────────────────────────────────────
// Lineage Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const AncestryNodeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	forkDepth: z.number().nullable(),
});

export const ForkNodeSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	authorId: z.string(),
	authorType: z.string(),
	createdAt: z.string(),
});

export const DependentNodeSchema = z.object({
	compositionId: z.string(),
	compositionSlug: z.string(),
	compositionName: z.string(),
	stepOrder: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Social & Agent Signals Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const InvocationBatchSchema = z.object({
	invocations: z
		.array(
			z.object({
				skillId: z.string(),
				compositionId: z.string().optional(),
				tenantId: z.string(),
				callerType: z.enum(["agent", "human"]),
				durationMs: z.number().optional(),
				succeeded: z.boolean(),
			}),
		)
		.min(1)
		.max(500),
});

export const CoOccurrenceResultSchema = z.object({
	skillId: z.string(),
	name: z.string(),
	slug: z.string(),
	compositionCount: z.number(),
	totalPairedInvocations: z.number(),
});

export const StarStatusSchema = z.object({
	starCount: z.number(),
	starred: z.boolean().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Leaderboards Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const LeaderboardEntrySchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	type: z
		.enum([
			"skill",
			"composition",
			"pipeline",
			"atomic",
			"auto-composite",
			"human-composite",
			"forked",
		])
		.nullish(),
	authorHandle: z.string().nullish(),
	authorType: z.enum(["human", "bot", "org"]).nullish(),
	score: z.number(),
	trustScore: z.number(),
	humanStarCount: z.number().nullish(),
	humanForkCount: z.number().nullish(),
	agentInvocationCount: z.union([z.number(), z.string().transform(Number)]).nullish(),
	weeklyAgentInvocationCount: z.number().nullish(),
	compositionInclusionCount: z.number().nullish(),
	avgExecutionTimeMs: z.number().nullish(),
	errorRate: z.number().nullish(),
});

export const LeaderboardResponseSchema = z.object({
	leaderboard: z.array(LeaderboardEntrySchema),
});

// ──────────────────────────────────────────────────────────────────────────────
// Authors Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const AuthorProfileSchema = z.object({
	id: z.string(),
	handle: z.string(),
	displayName: z.string().nullable(),
	authorType: z.enum(["human", "bot", "org"]),
	bio: z.string().nullable(),
	avatarUrl: z.string().nullable(),
	homepageUrl: z.string().nullable(),
	botModel: z.string().nullable(),
	verified: z.boolean(),
	stats: z.object({
		publishedCount: z.number(),
		totalStars: z.number(),
		totalInvocations: z.number(),
		totalForks: z.number(),
	}),
	createdAt: z.string(),
});

export const AuthorSkillsResponseSchema = z.object({
	skills: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
			slug: z.string(),
			type: z.enum([
				"skill",
				"composition",
				"pipeline",
				"atomic",
				"auto-composite",
				"human-composite",
				"forked",
			]),
			status: z.enum([
				"published",
				"deprecated",
				"archived",
				"draft",
				"vulnerable",
				"revoked",
				"degraded",
				"contains-vulnerable",
			]),
			description: z.string(),
			trustScore: z.number(),
			humanStarCount: z.number(),
			agentInvocationCount: z.number(),
			tags: z.array(z.string()),
			createdAt: z.string(),
			publishedAt: z.string().nullable(),
		}),
	),
	limit: z.number(),
	offset: z.number(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Skills v5 Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const IndexSkillInputSchema = z.object({
	skillId: z.string(),
	skillMd: z.string(),
});

export const IndexSkillResultSchema = z.object({
	skillId: z.string(),
	summary: z.string(),
	embedding: z.array(z.number()),
	flagged: z.boolean(),
	categories: z.array(z.string()),
});

export const UploadBundleResultSchema = z.object({
	skillId: z.string(),
	bundleKey: z.string(),
	uploadedAt: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Analytics Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const TierDistributionSchema = z.object({
	tier1: z.number(),
	tier2: z.number(),
	tier3: z.number(),
});

export const MatchSourceStatsSchema = z.object({
	source: z.string(),
	count: z.number(),
	avgScore: z.number(),
});

export const LatencyPercentilesSchema = z.object({
	p50: z.number(),
	p95: z.number(),
	p99: z.number(),
	p999: z.number(),
});

export const CostBreakdownSchema = z.object({
	embeddingCost: z.number(),
	llmCost: z.number(),
	totalCost: z.number(),
	period: z.string(),
});

export const FailedQuerySchema = z.object({
	query: z.string(),
	timestamp: z.string(),
	tier: z.number(),
	confidence: z.string(),
});

export const Tier3PatternSchema = z.object({
	pattern: z.string(),
	count: z.number(),
	avgConfidence: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Eval Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const EvalRunResultSchema = z.object({
	runId: z.string(),
	status: z.enum(["queued", "running", "completed", "failed"]),
	startedAt: z.string(),
});

export const EvalResultSchema = z.object({
	runId: z.string(),
	status: z.enum(["queued", "running", "completed", "failed"]),
	startedAt: z.string(),
	completedAt: z.string().nullable(),
	results: z
		.array(
			z.object({
				query: z.string(),
				expectedSkill: z.string(),
				actualSkill: z.string().nullable(),
				success: z.boolean(),
				tier: z.number(),
				confidence: z.string(),
				latencyMs: z.number(),
			}),
		)
		.optional(),
	summary: z
		.object({
			totalTests: z.number(),
			passed: z.number(),
			failed: z.number(),
			avgLatency: z.number(),
		})
		.optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Admin Schemas (Cognium Circle-IR Integration)
// ──────────────────────────────────────────────────────────────────────────────

export const AdminScanResultSchema = z.object({
	skillId: z.string(),
	scanId: z.string(),
	status: z.enum(["queued", "scanning", "completed", "failed"]),
	verificationTier: z
		.enum(["unverified", "scanned", "verified", "certified"])
		.optional(),
	findings: z
		.array(
			z.object({
				severity: z.enum(["critical", "high", "medium", "low", "info"]),
				category: z.string(),
				message: z.string(),
			}),
		)
		.optional(),
});

export const AdminBackfillResultSchema = z.object({
	queued: z.number(),
	message: z.string(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Skills CRUD Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const PublishSkillInputSchema = z.object({
	name: z.string().min(1).max(200),
	slug: z.string().regex(/^[a-z0-9-]+$/),
	version: z.string().optional(),
	description: z.string().min(10).max(2000),
	schemaJson: z.record(z.string(), z.unknown()).optional(),
	executionLayer: z.enum([
		"mcp-remote",
		"instructions",
		"worker",
		"container",
		"composite",
	]),
	mcpUrl: z.string().optional(),
	skillMd: z.string().optional(),
	capabilitiesRequired: z.array(z.string()).optional(),
	source: z
		.enum(["manual", "forge", "human-distilled", "mcp-registry", "clawhub", "github"])
		.optional(),
	sourceUrl: z.string().optional(),
	tenantId: z.string().optional(),
	trustScore: z.number().min(0).max(1).optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	authorId: z.string().optional(),
	authorHandle: z.string().optional(),
	authorType: z.enum(["human", "bot", "org"]).optional(),
	authorBotModel: z.string().optional(),
	// v5 fields
	skillType: z
		.enum(["atomic", "auto-composite", "human-composite", "forked"])
		.optional(),
	forkedFrom: z.string().optional(),
	// v5.2 fields
	runtimeEnv: z.enum(["llm", "api", "browser", "vm", "local"]).optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
	environmentVariables: z.array(z.string()).optional(),
	// v5.4 fields
	workflowDefinition: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateSkillInputSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	description: z.string().min(10).max(2000).optional(),
	schemaJson: z.record(z.string(), z.unknown()).optional(),
	mcpUrl: z.string().optional(),
	skillMd: z.string().optional(),
	capabilitiesRequired: z.array(z.string()).optional(),
	tags: z.array(z.string()).optional(),
	category: z.string().optional(),
	// v5.2 fields
	runtimeEnv: z.enum(["llm", "api", "browser", "vm", "local"]).optional(),
	visibility: z.enum(["public", "private", "unlisted"]).optional(),
	environmentVariables: z.array(z.string()).optional(),
	// v5.4 fields
	workflowDefinition: z.record(z.string(), z.unknown()).optional(),
});

// v5.0: Owner status change schema
export const StatusChangeInputSchema = z.object({
	status: z.enum(["deprecated", "published"]),
	reason: z.string().optional(),
	replacementSkillId: z.string().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────
// Skill Versions Schemas (v5.2)
// ──────────────────────────────────────────────────────────────────────────────

export const SkillVersionSchema = z.object({
	id: z.string(),
	name: z.string(),
	version: z.string(),
	status: z.string(),
	trustScore: z.number(),
	verificationTier: z.string(),
	runCount: z.number(),
	executionLayer: z.string(),
	source: z.string(),
	skillType: z.string(),
	runtimeEnv: z.string(),
	visibility: z.string(),
	cogniumScanned: z.boolean(),
	cogniumScannedAt: z.string().nullable(),
	createdAt: z.string().nullable(),
	updatedAt: z.string().nullable(),
	publishedAt: z.string().nullable(),
});

export const SkillVersionsResponseSchema = z.object({
	slug: z.string(),
	totalVersions: z.number(),
	versions: z.array(SkillVersionSchema),
});

// ──────────────────────────────────────────────────────────────────────────────
// Eval List & Compare Schemas (v5.2)
// ──────────────────────────────────────────────────────────────────────────────

export const EvalRunSummarySchema = z.object({
	runId: z.string(),
	timestamp: z.string(),
	recall1: z.number(),
	recall5: z.number(),
	mrr: z.number(),
	passed: z.number(),
	failed: z.number(),
	fixtureCount: z.number(),
});

export const EvalListResponseSchema = z.object({
	runs: z.array(EvalRunSummarySchema),
});

// ──────────────────────────────────────────────────────────────────────────────
// Analytics: Revoked Impact & Vulnerable Usage Schemas (v5.2)
// ──────────────────────────────────────────────────────────────────────────────

export const RevokedImpactResponseSchema = z.object({
	revokedCount: z.number(),
	revokedSkills: z.array(z.record(z.string(), z.unknown())),
	affectedSearches30d: z.number(),
});

export const VulnerableUsageResponseSchema = z.object({
	vulnerableCount: z.number(),
	vulnerableSkills: z.array(z.record(z.string(), z.unknown())),
	appearedInSearch30d: z.number(),
});
