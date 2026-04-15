// Middleware
export { apiKeyAuth } from "./middleware.js";
export type { ApiKeyAuthOptions } from "./middleware.js";

// Key management
export { KeyManager, PLAN_DEFAULTS } from "./management.js";
export type { ManagementDb } from "./management.js";

// Rate limiting
export { RateLimiter, PLAN_BURST_LIMITS } from "./rate-limit.js";

// Hash utilities
export { sha256, generateApiKey } from "./hash.js";

// Types
export type {
	ApiScope,
	TenantType,
	TenantStatus,
	TenantPlan,
	TenantRecord,
	KeyType,
	KeyStatus,
	ApiKeyRecord,
	ApiKeyMetadata,
	ApiKeyEnv,
	ApiKeyVariables,
	DbAdapter,
	RateLimitResult,
	GeneratedKey,
	RotationResult,
} from "./types.js";

// Validation schemas (for management API request validation)
export {
	API_SCOPES,
	TenantType as TenantTypeSchema,
	TenantStatus as TenantStatusSchema,
	TenantPlan as TenantPlanSchema,
	KeyType as KeyTypeSchema,
	KeyStatus as KeyStatusSchema,
	CreateTenantInput,
	CreateKeyInput,
} from "./types.js";
