// Main client
export { RunicsClient } from "./client.js";

// MCP server factory
export { createRunicsMcpServer } from "./mcp.js";
export type { McpServerOptions } from "./mcp.js";

// Types
export type {
	CompositionPart,
	CompositionResult,
	FeedbackParams,
	FindSkillOptions,
	FindSkillResponse,
	GenerationHints,
	ListSkillsOptions,
	PaginatedSkillList,
	RunicsClientOptions,
	SearchMeta,
	SearchTrace,
	Skill,
	SkillResult,
} from "./types.js";

// Zod schemas (for consumers who want to extend validation)
export {
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

// Errors
export {
	RunicsError,
	RunicsNetworkError,
	RunicsNotFoundError,
	RunicsRateLimitError,
	RunicsServerError,
	RunicsValidationError,
} from "./errors.js";
