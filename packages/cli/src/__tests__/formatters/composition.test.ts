import type { CompositionResult } from "runics-client";
import { describe, expect, it, vi } from "vitest";
import { formatComposition } from "../../formatters/composition.js";

describe("formatComposition", () => {
	it("should format composition with matched skills", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const composition: CompositionResult = {
			detected: true,
			parts: [
				{
					purpose: "lint code",
					skill: {
						id: "skill-1",
						name: "Linter",
						slug: "linter",
						agentSummary: "Lints code",
						trustScore: 0.9,
						executionLayer: "cli",
						capabilitiesRequired: [],
						score: 0.85,
						matchSource: "name",
					},
				},
				{
					purpose: "deploy",
					skill: null,
				},
			],
			reasoning: "Multi-step task detected",
		};

		formatComposition(composition);

		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should not format when composition not detected", () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const composition: CompositionResult = {
			detected: false,
			parts: [],
			reasoning: "Single task",
		};

		formatComposition(composition);

		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
