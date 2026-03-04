import { FetchError, ofetch } from "ofetch";
import { ZodError } from "zod";
import {
	RunicsNetworkError,
	RunicsNotFoundError,
	RunicsRateLimitError,
	RunicsServerError,
	RunicsValidationError,
} from "./errors.js";
import { FindSkillResponseSchema, PaginatedSkillListSchema, SkillSchema } from "./schemas.js";
import type {
	FeedbackParams,
	FindSkillOptions,
	FindSkillResponse,
	ListSkillsOptions,
	PaginatedSkillList,
	RunicsClientOptions,
	Skill,
} from "./types.js";

export class RunicsClient {
	private baseUrl: string;
	private retry: number;
	private retryDelay: number;
	private timeout: number;
	private onRequest?: (context: { request: RequestInit; url: string }) => void;
	private onResponse?: (context: { response: Response; url: string }) => void;

	constructor(options: RunicsClientOptions = {}) {
		this.baseUrl = options.baseUrl || "http://localhost:8787";
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
			const body = {
				query,
				limit: options?.limit,
				minTrustScore: options?.minTrustScore,
				maxTier: options?.maxTier,
				executionLayer: options?.executionLayer,
				capabilitiesRequired: options?.capabilitiesRequired,
			};

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
}
