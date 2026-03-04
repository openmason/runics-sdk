import type { ZodError } from "zod";

export class RunicsError extends Error {
	code: string;
	statusCode?: number;
	responseBody?: unknown;

	constructor(message: string, code: string, statusCode?: number, responseBody?: unknown) {
		super(message);
		this.name = "RunicsError";
		this.code = code;
		this.statusCode = statusCode;
		this.responseBody = responseBody;
	}
}

export class RunicsNetworkError extends RunicsError {
	constructor(message: string, responseBody?: unknown) {
		super(message, "network_error", undefined, responseBody);
		this.name = "RunicsNetworkError";
	}
}

export class RunicsRateLimitError extends RunicsError {
	retryAfter?: number;

	constructor(message: string, statusCode: number, retryAfter?: number, responseBody?: unknown) {
		super(message, "rate_limit", statusCode, responseBody);
		this.name = "RunicsRateLimitError";
		this.retryAfter = retryAfter;
	}
}

export class RunicsNotFoundError extends RunicsError {
	constructor(message: string, responseBody?: unknown) {
		super(message, "not_found", 404, responseBody);
		this.name = "RunicsNotFoundError";
	}
}

export class RunicsServerError extends RunicsError {
	constructor(message: string, statusCode: number, responseBody?: unknown) {
		super(message, "server_error", statusCode, responseBody);
		this.name = "RunicsServerError";
	}
}

export class RunicsValidationError extends RunicsError {
	zodErrors: ZodError;

	constructor(message: string, zodErrors: ZodError) {
		super(message, "validation_error");
		this.name = "RunicsValidationError";
		this.zodErrors = zodErrors;
	}
}
