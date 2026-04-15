import { FetchError, ofetch } from "ofetch";
import { ZodError } from "zod";
import {
	RunicsNetworkError,
	RunicsNotFoundError,
	RunicsRateLimitError,
	RunicsServerError,
	RunicsValidationError,
} from "./errors.js";
import {
	AuthorProfileSchema,
	AuthorSkillsResponseSchema,
	CompositionDetailSchema,
	CoOccurrenceResultSchema,
	EvalListResponseSchema,
	FindSkillResponseSchema,
	ForkResultSchema,
	IndexSkillResultSchema,
	LeaderboardResponseSchema,
	PaginatedSkillListSchema,
	RevokedImpactResponseSchema,
	SkillSchema,
	SkillVersionsResponseSchema,
	StarStatusSchema,
	UploadBundleResultSchema,
	VulnerableUsageResponseSchema,
} from "./schemas.js";
import type {
	AncestryNode,
	AuthorProfile,
	AuthorSkillsResponse,
	CompositionDetail,
	CompositionInput,
	CoOccurrenceResult,
	CopyInput,
	DependentNode,
	EvalListResponse,
	ExtendInput,
	FeedbackParams,
	FindSkillOptions,
	FindSkillResponse,
	ForkInput,
	ForkNode,
	ForkResult,
	InvocationBatch,
	LeaderboardResponse,
	ListSkillsOptions,
	PaginatedSkillList,
	PublishSkillInput,
	RevokedImpactResponse,
	RunicsClientOptions,
	Skill,
	SkillVersionsResponse,
	StarStatus,
	StatusChangeInput,
	UpdateSkillInput,
	VulnerableUsageResponse,
	CompositionStep,
} from "./types.js";

export class RunicsClient {
	private baseUrl: string;
	private tenantId?: string;
	private retry: number;
	private retryDelay: number;
	private timeout: number;
	private onRequest?: (context: { request: RequestInit; url: string }) => void;
	private onResponse?: (context: { response: Response; url: string }) => void;

	constructor(options: RunicsClientOptions = {}) {
		this.baseUrl = options.baseUrl || "http://localhost:8787";
		this.tenantId = options.tenantId;
		this.retry = options.retry ?? 3;
		this.retryDelay = options.retryDelay ?? 500;
		this.timeout = options.timeout ?? 10000;
		this.onRequest = options.onRequest;
		this.onResponse = options.onResponse;
	}

	private async fetch<T>(url: string, options: RequestInit = {}): Promise<T> {
		const fullUrl = `${this.baseUrl}${url}`;

		// Call onRequest hook if provided
		if (this.onRequest) {
			this.onRequest({ request: options, url: fullUrl });
		}

		try {
			const response = await ofetch<T>(fullUrl, {
				...options,
				retry: this.retry,
				retryDelay: this.retryDelay,
				timeout: this.timeout,
				retryStatusCodes: [429, 502, 503, 504],
				onResponse: ({ response }) => {
					if (this.onResponse) {
						this.onResponse({ response, url: fullUrl });
					}
				},
				onResponseError: ({ response }) => {
					const status = response.status;
					const responseBody = response._data;

					// Parse Retry-After header for 429
					if (status === 429) {
						const retryAfter = response.headers.get("Retry-After");
						const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : undefined;
						throw new RunicsRateLimitError(
							"Rate limit exceeded",
							status,
							retryAfterSeconds,
							responseBody,
						);
					}

					// 404 errors
					if (status === 404) {
						throw new RunicsNotFoundError("Resource not found", responseBody);
					}

					// 5xx errors
					if (status >= 500) {
						throw new RunicsServerError("Server error", status, responseBody);
					}

					// All other errors
					throw new RunicsNetworkError(`Request failed with status ${status}`, responseBody);
				},
			});

			return response;
		} catch (error) {
			// Re-throw our custom errors
			if (
				error instanceof RunicsRateLimitError ||
				error instanceof RunicsNotFoundError ||
				error instanceof RunicsServerError ||
				error instanceof RunicsNetworkError
			) {
				throw error;
			}

			// Handle network errors
			if (error instanceof FetchError) {
				throw new RunicsNetworkError(error.message, error.data);
			}

			// Re-throw unknown errors
			throw error;
		}
	}

	async findSkill(query: string, options?: FindSkillOptions): Promise<FindSkillResponse> {
		try {
			const body: Record<string, unknown> = {
				query,
			};

			// Add tenantId if provided
			if (this.tenantId) {
				body.tenantId = this.tenantId;
			}

			// Add optional fields only if they have values
			if (options?.limit !== undefined) body.limit = options.limit;
			if (options?.minTrustScore !== undefined) body.minTrustScore = options.minTrustScore;
			if (options?.maxTier !== undefined) body.maxTier = options.maxTier;
			if (options?.executionLayer) body.executionLayer = options.executionLayer;
			if (options?.capabilitiesRequired) body.capabilitiesRequired = options.capabilitiesRequired;
			// v5 fields
			if (options?.appetite) body.appetite = options.appetite;
			if (options?.tags) body.tags = options.tags;
			if (options?.category) body.category = options.category;
			// v5.2 fields
			if (options?.runtimeEnv) body.runtimeEnv = options.runtimeEnv;
			if (options?.visibility) body.visibility = options.visibility;

			const data = await this.fetch<unknown>("/v1/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			return FindSkillResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getSkill(slug: string): Promise<Skill> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${slug}`, {
				method: "GET",
			});

			return SkillSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async submitFeedback(params: FeedbackParams): Promise<void> {
		try {
			await this.fetch<void>("/v1/search/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(params),
			});
		} catch (error) {
			// Fire-and-forget: log warning but don't throw
			console.warn("Failed to submit feedback:", error);
		}
	}

	async listSkills(options?: ListSkillsOptions): Promise<PaginatedSkillList> {
		try {
			const params = new URLSearchParams();
			if (options?.cursor) params.set("cursor", options.cursor);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.source) params.set("source", options.source);
			if (options?.sortBy) params.set("sortBy", options.sortBy);
			if (options?.sortOrder) params.set("sortOrder", options.sortOrder);

			const queryString = params.toString();
			const url = queryString ? `/v1/skills?${queryString}` : "/v1/skills";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});

			return PaginatedSkillListSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async health(): Promise<{ status: string }> {
		return await this.fetch<{ status: string }>("/health", {
			method: "GET",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Skills CRUD
	// ──────────────────────────────────────────────────────────────────────────

	async publishSkill(input: PublishSkillInput): Promise<{ id: string; slug: string; status: string }> {
		return await this.fetch("/v1/skills", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	}

	async updateSkill(
		id: string,
		input: UpdateSkillInput,
	): Promise<{ id: string; status: string }> {
		return await this.fetch(`/v1/skills/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	}

	async deleteSkill(id: string): Promise<{ success: boolean; skillId: string; deleted: boolean }> {
		return await this.fetch(`/v1/skills/${id}`, {
			method: "DELETE",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Skills v5
	// ──────────────────────────────────────────────────────────────────────────

	async indexSkill(input: { skillId: string; skillMd: string }): Promise<{
		skillId: string;
		summary: string;
		embedding: number[];
		flagged: boolean;
		categories: string[];
	}> {
		return await this.fetch(`/v1/skills/${input.skillId}/index`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	}

	async uploadBundle(skillId: string, bundle: Blob | File): Promise<{
		skillId: string;
		bundleKey: string;
		uploadedAt: string;
	}> {
		const formData = new FormData();
		formData.append("bundle", bundle);

		return await this.fetch(`/v1/skills/${skillId}/bundle`, {
			method: "POST",
			body: formData,
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Composition
	// ──────────────────────────────────────────────────────────────────────────

	async forkSkill(id: string, input: ForkInput): Promise<ForkResult> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${id}/fork`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return ForkResultSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async copySkill(id: string, input: CopyInput): Promise<ForkResult> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${id}/copy`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return ForkResultSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async extendComposition(id: string, input: ExtendInput): Promise<ForkResult> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${id}/extend`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});
			return ForkResultSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async createComposition(
		input: CompositionInput,
	): Promise<{ id: string; slug: string; status: string }> {
		return await this.fetch("/v1/compositions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	}

	async getComposition(id: string): Promise<CompositionDetail> {
		try {
			const data = await this.fetch<unknown>(`/v1/compositions/${id}`, {
				method: "GET",
			});
			return CompositionDetailSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async replaceCompositionSteps(
		id: string,
		steps: CompositionStep[],
	): Promise<{ id: string; status: string }> {
		return await this.fetch(`/v1/compositions/${id}/steps`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ steps }),
		});
	}

	async publishComposition(id: string): Promise<{ id: string; status: string }> {
		return await this.fetch(`/v1/compositions/${id}/publish`, {
			method: "POST",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Lineage
	// ──────────────────────────────────────────────────────────────────────────

	async getLineage(id: string): Promise<{ ancestry: AncestryNode[] }> {
		return await this.fetch(`/v1/skills/${id}/lineage`, {
			method: "GET",
		});
	}

	async getForks(id: string): Promise<{ forks: ForkNode[] }> {
		return await this.fetch(`/v1/skills/${id}/forks`, {
			method: "GET",
		});
	}

	async getDependents(id: string): Promise<{ dependents: DependentNode[] }> {
		return await this.fetch(`/v1/skills/${id}/dependents`, {
			method: "GET",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Social
	// ──────────────────────────────────────────────────────────────────────────

	async starSkill(id: string, userId: string): Promise<{ starred: boolean; starCount: number }> {
		return await this.fetch(`/v1/skills/${id}/star`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
	}

	async unstarSkill(id: string, userId: string): Promise<{ starred: boolean; starCount: number }> {
		return await this.fetch(`/v1/skills/${id}/star`, {
			method: "DELETE",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId }),
		});
	}

	async getStarStatus(id: string, userId?: string): Promise<StarStatus> {
		try {
			const params = new URLSearchParams();
			if (userId) params.set("userId", userId);
			const queryString = params.toString();
			const url = queryString ? `/v1/skills/${id}/stars?${queryString}` : `/v1/skills/${id}/stars`;

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return StarStatusSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Agent Signals
	// ──────────────────────────────────────────────────────────────────────────

	async recordInvocations(batch: InvocationBatch): Promise<{ accepted: boolean; count: number }> {
		return await this.fetch("/v1/invocations", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(batch),
		});
	}

	async getCoOccurrence(
		id: string,
		limit = 5,
	): Promise<{ cooccurrence: CoOccurrenceResult[] }> {
		try {
			const params = new URLSearchParams();
			params.set("limit", limit.toString());
			const data = await this.fetch<unknown>(`/v1/skills/${id}/cooccurrence?${params.toString()}`, {
				method: "GET",
			});
			return {
				cooccurrence: (data as { cooccurrence: unknown[] }).cooccurrence.map((item) =>
					CoOccurrenceResultSchema.parse(item),
				),
			};
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Leaderboards
	// ──────────────────────────────────────────────────────────────────────────

	async getHumanLeaderboard(options?: {
		type?: string;
		category?: string;
		ecosystem?: string;
		limit?: number;
		offset?: number;
	}): Promise<LeaderboardResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.category) params.set("category", options.category);
			if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/leaderboards/human?${queryString}`
				: "/v1/leaderboards/human";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return LeaderboardResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getAgentLeaderboard(options?: {
		type?: string;
		category?: string;
		ecosystem?: string;
		limit?: number;
		offset?: number;
	}): Promise<LeaderboardResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.category) params.set("category", options.category);
			if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/leaderboards/agents?${queryString}`
				: "/v1/leaderboards/agents";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return LeaderboardResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getTrendingLeaderboard(options?: {
		type?: string;
		category?: string;
		ecosystem?: string;
		limit?: number;
		offset?: number;
	}): Promise<LeaderboardResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.category) params.set("category", options.category);
			if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/leaderboards/trending?${queryString}`
				: "/v1/leaderboards/trending";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return LeaderboardResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getMostComposedLeaderboard(options?: {
		type?: string;
		category?: string;
		ecosystem?: string;
		limit?: number;
		offset?: number;
	}): Promise<LeaderboardResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.category) params.set("category", options.category);
			if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/leaderboards/most-composed?${queryString}`
				: "/v1/leaderboards/most-composed";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return LeaderboardResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Authors
	// ──────────────────────────────────────────────────────────────────────────

	async getAuthor(handle: string): Promise<AuthorProfile> {
		try {
			const data = await this.fetch<unknown>(`/v1/authors/${handle}`, {
				method: "GET",
			});
			return AuthorProfileSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getAuthorSkills(
		handle: string,
		options?: {
			type?: "skill" | "composition" | "pipeline";
			status?: "published" | "deprecated" | "archived" | "draft";
			limit?: number;
			offset?: number;
		},
	): Promise<AuthorSkillsResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.status) params.set("status", options.status);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/authors/${handle}/skills?${queryString}`
				: `/v1/authors/${handle}/skills`;

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return AuthorSkillsResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Analytics
	// ──────────────────────────────────────────────────────────────────────────

	async getTierDistribution(options?: {
		startDate?: string;
		endDate?: string;
	}): Promise<{ tier1: number; tier2: number; tier3: number }> {
		const params = new URLSearchParams();
		if (options?.startDate) params.set("startDate", options.startDate);
		if (options?.endDate) params.set("endDate", options.endDate);

		const queryString = params.toString();
		const url = queryString ? `/v1/analytics/tiers?${queryString}` : "/v1/analytics/tiers";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	async getMatchSources(options?: {
		startDate?: string;
		endDate?: string;
	}): Promise<{ source: string; count: number; avgScore: number }[]> {
		const params = new URLSearchParams();
		if (options?.startDate) params.set("startDate", options.startDate);
		if (options?.endDate) params.set("endDate", options.endDate);

		const queryString = params.toString();
		const url = queryString
			? `/v1/analytics/match-sources?${queryString}`
			: "/v1/analytics/match-sources";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	async getLatencyPercentiles(options?: {
		startDate?: string;
		endDate?: string;
	}): Promise<{ p50: number; p95: number; p99: number; p999: number }> {
		const params = new URLSearchParams();
		if (options?.startDate) params.set("startDate", options.startDate);
		if (options?.endDate) params.set("endDate", options.endDate);

		const queryString = params.toString();
		const url = queryString
			? `/v1/analytics/latency?${queryString}`
			: "/v1/analytics/latency";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	async getCostBreakdown(options?: {
		startDate?: string;
		endDate?: string;
	}): Promise<{
		embeddingCost: number;
		llmCost: number;
		totalCost: number;
		period: string;
	}> {
		const params = new URLSearchParams();
		if (options?.startDate) params.set("startDate", options.startDate);
		if (options?.endDate) params.set("endDate", options.endDate);

		const queryString = params.toString();
		const url = queryString ? `/v1/analytics/cost?${queryString}` : "/v1/analytics/cost";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	async getFailedQueries(options?: {
		limit?: number;
		offset?: number;
	}): Promise<{ query: string; timestamp: string; tier: number; confidence: string }[]> {
		const params = new URLSearchParams();
		if (options?.limit !== undefined) params.set("limit", options.limit.toString());
		if (options?.offset !== undefined) params.set("offset", options.offset.toString());

		const queryString = params.toString();
		const url = queryString
			? `/v1/analytics/failed-queries?${queryString}`
			: "/v1/analytics/failed-queries";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	async getTier3Patterns(options?: {
		limit?: number;
	}): Promise<{ pattern: string; count: number; avgConfidence: string }[]> {
		const params = new URLSearchParams();
		if (options?.limit !== undefined) params.set("limit", options.limit.toString());

		const queryString = params.toString();
		const url = queryString
			? `/v1/analytics/tier3-patterns?${queryString}`
			: "/v1/analytics/tier3-patterns";

		return await this.fetch(url, {
			method: "GET",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Eval
	// ──────────────────────────────────────────────────────────────────────────

	async runEval(): Promise<{
		runId: string;
		status: "queued" | "running" | "completed" | "failed";
		startedAt: string;
	}> {
		return await this.fetch("/v1/eval/run", {
			method: "POST",
		});
	}

	async getEvalResults(runId: string): Promise<{
		runId: string;
		status: "queued" | "running" | "completed" | "failed";
		startedAt: string;
		completedAt: string | null;
		results?: Array<{
			query: string;
			expectedSkill: string;
			actualSkill: string | null;
			success: boolean;
			tier: number;
			confidence: string;
			latencyMs: number;
		}>;
		summary?: {
			totalTests: number;
			passed: number;
			failed: number;
			avgLatency: number;
		};
	}> {
		return await this.fetch(`/v1/eval/results/${runId}`, {
			method: "GET",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Admin (Cognium Circle-IR Integration)
	// ──────────────────────────────────────────────────────────────────────────

	async adminScanSkill(skillId: string): Promise<{
		skillId: string;
		scanId: string;
		status: "queued" | "scanning" | "completed" | "failed";
		verificationTier?: "unverified" | "scanned" | "verified" | "certified";
		findings?: Array<{
			severity: "critical" | "high" | "medium" | "low" | "info";
			category: string;
			message: string;
		}>;
	}> {
		return await this.fetch(`/v1/admin/scan/${skillId}`, {
			method: "POST",
		});
	}

	async adminScanTest(
		skillId: string,
		findings: Array<{
			severity: "critical" | "high" | "medium" | "low" | "info";
			category: string;
			message: string;
		}>,
	): Promise<{
		skillId: string;
		scanId: string;
		status: "queued" | "scanning" | "completed" | "failed";
		verificationTier?: "unverified" | "scanned" | "verified" | "certified";
		findings?: Array<{
			severity: "critical" | "high" | "medium" | "low" | "info";
			category: string;
			message: string;
		}>;
	}> {
		return await this.fetch(`/v1/admin/scan-test/${skillId}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ findings }),
		});
	}

	async adminBackfill(options?: { limit?: number }): Promise<{
		queued: number;
		message: string;
	}> {
		const params = new URLSearchParams();
		if (options?.limit !== undefined) params.set("limit", options.limit.toString());

		const queryString = params.toString();
		const url = queryString ? `/v1/admin/backfill?${queryString}` : "/v1/admin/backfill";

		return await this.fetch(url, {
			method: "POST",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Skill Versions (v5.2)
	// ──────────────────────────────────────────────────────────────────────────

	async getSkillVersions(slug: string): Promise<SkillVersionsResponse> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${slug}/versions`, {
				method: "GET",
			});
			return SkillVersionsResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getSkillVersion(slug: string, version: string): Promise<Skill> {
		try {
			const data = await this.fetch<unknown>(`/v1/skills/${slug}/${version}`, {
				method: "GET",
			});
			return SkillSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Publish Workflow (v5.0/v5.2)
	// ──────────────────────────────────────────────────────────────────────────

	async changeSkillStatus(
		id: string,
		input: StatusChangeInput,
	): Promise<{ id: string; status: string }> {
		return await this.fetch(`/v1/skills/${id}/status`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		});
	}

	async publishDraft(id: string): Promise<{ id: string; status: string }> {
		return await this.fetch(`/v1/skills/${id}/publish`, {
			method: "POST",
		});
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Most-Forked Leaderboard (v5.2)
	// ──────────────────────────────────────────────────────────────────────────

	async getMostForkedLeaderboard(options?: {
		type?: string;
		category?: string;
		ecosystem?: string;
		limit?: number;
		offset?: number;
	}): Promise<LeaderboardResponse> {
		try {
			const params = new URLSearchParams();
			if (options?.type) params.set("type", options.type);
			if (options?.category) params.set("category", options.category);
			if (options?.ecosystem) params.set("ecosystem", options.ecosystem);
			if (options?.limit !== undefined) params.set("limit", options.limit.toString());
			if (options?.offset !== undefined) params.set("offset", options.offset.toString());

			const queryString = params.toString();
			const url = queryString
				? `/v1/leaderboards/most-forked?${queryString}`
				: "/v1/leaderboards/most-forked";

			const data = await this.fetch<unknown>(url, {
				method: "GET",
			});
			return LeaderboardResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Analytics: Revoked Impact & Vulnerable Usage (v5.2)
	// ──────────────────────────────────────────────────────────────────────────

	async getRevokedImpact(): Promise<RevokedImpactResponse> {
		try {
			const data = await this.fetch<unknown>("/v1/analytics/revoked-impact", {
				method: "GET",
			});
			return RevokedImpactResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async getVulnerableUsage(): Promise<VulnerableUsageResponse> {
		try {
			const data = await this.fetch<unknown>("/v1/analytics/vulnerable-usage", {
				method: "GET",
			});
			return VulnerableUsageResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	// ──────────────────────────────────────────────────────────────────────────
	// Eval: List & Compare (v5.2)
	// ──────────────────────────────────────────────────────────────────────────

	async listEvalRuns(): Promise<EvalListResponse> {
		try {
			const data = await this.fetch<unknown>("/v1/eval/results", {
				method: "GET",
			});
			return EvalListResponseSchema.parse(data);
		} catch (error) {
			if (error instanceof ZodError) {
				throw new RunicsValidationError("Response validation failed", error);
			}
			throw error;
		}
	}

	async compareEvalRuns(runA: string, runB: string): Promise<unknown> {
		return await this.fetch(`/v1/eval/compare?runA=${encodeURIComponent(runA)}&runB=${encodeURIComponent(runB)}`, {
			method: "GET",
		});
	}
}
