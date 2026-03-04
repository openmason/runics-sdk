import { describe, expect, it } from "vitest";
import { type ZodError, z } from "zod";
import {
	RunicsError,
	RunicsNetworkError,
	RunicsNotFoundError,
	RunicsRateLimitError,
	RunicsServerError,
	RunicsValidationError,
} from "../errors.js";

describe("RunicsError", () => {
	it("should create error with code and message", () => {
		const error = new RunicsError("Test error", "test_code");
		expect(error.message).toBe("Test error");
		expect(error.code).toBe("test_code");
		expect(error.name).toBe("RunicsError");
	});

	it("should include statusCode and responseBody", () => {
		const error = new RunicsError("Test", "test", 400, { detail: "bad request" });
		expect(error.statusCode).toBe(400);
		expect(error.responseBody).toEqual({ detail: "bad request" });
	});

	it("should be instanceof Error", () => {
		const error = new RunicsError("Test", "test");
		expect(error instanceof Error).toBe(true);
	});
});

describe("RunicsNetworkError", () => {
	it("should have correct name and code", () => {
		const error = new RunicsNetworkError("Network failed");
		expect(error.name).toBe("RunicsNetworkError");
		expect(error.code).toBe("network_error");
	});

	it("should be instanceof RunicsError", () => {
		const error = new RunicsNetworkError("Test");
		expect(error instanceof RunicsError).toBe(true);
		expect(error instanceof RunicsNetworkError).toBe(true);
	});
});

describe("RunicsRateLimitError", () => {
	it("should include retryAfter", () => {
		const error = new RunicsRateLimitError("Rate limited", 429, 60);
		expect(error.name).toBe("RunicsRateLimitError");
		expect(error.code).toBe("rate_limit");
		expect(error.statusCode).toBe(429);
		expect(error.retryAfter).toBe(60);
	});

	it("should be instanceof RunicsError", () => {
		const error = new RunicsRateLimitError("Test", 429);
		expect(error instanceof RunicsError).toBe(true);
		expect(error instanceof RunicsRateLimitError).toBe(true);
	});
});

describe("RunicsNotFoundError", () => {
	it("should have 404 status code", () => {
		const error = new RunicsNotFoundError("Not found");
		expect(error.name).toBe("RunicsNotFoundError");
		expect(error.code).toBe("not_found");
		expect(error.statusCode).toBe(404);
	});

	it("should be instanceof RunicsError", () => {
		const error = new RunicsNotFoundError("Test");
		expect(error instanceof RunicsError).toBe(true);
		expect(error instanceof RunicsNotFoundError).toBe(true);
	});
});

describe("RunicsServerError", () => {
	it("should include server status code", () => {
		const error = new RunicsServerError("Server error", 500);
		expect(error.name).toBe("RunicsServerError");
		expect(error.code).toBe("server_error");
		expect(error.statusCode).toBe(500);
	});

	it("should be instanceof RunicsError", () => {
		const error = new RunicsServerError("Test", 503);
		expect(error instanceof RunicsError).toBe(true);
		expect(error instanceof RunicsServerError).toBe(true);
	});
});

describe("RunicsValidationError", () => {
	it("should include zodErrors", () => {
		const schema = z.object({ name: z.string() });
		let zodError: ZodError | undefined;
		try {
			schema.parse({ name: 123 });
		} catch (e) {
			zodError = e as ZodError;
		}

		if (!zodError) throw new Error("Expected zodError to be defined");

		const error = new RunicsValidationError("Validation failed", zodError);
		expect(error.name).toBe("RunicsValidationError");
		expect(error.code).toBe("validation_error");
		expect(error.zodErrors).toBeDefined();
		expect(error.zodErrors.issues.length).toBeGreaterThan(0);
	});

	it("should be instanceof RunicsError", () => {
		const schema = z.object({ name: z.string() });
		let zodError: ZodError | undefined;
		try {
			schema.parse({});
		} catch (e) {
			zodError = e as ZodError;
		}

		if (!zodError) throw new Error("Expected zodError to be defined");

		const error = new RunicsValidationError("Test", zodError);
		expect(error instanceof RunicsError).toBe(true);
		expect(error instanceof RunicsValidationError).toBe(true);
	});
});
