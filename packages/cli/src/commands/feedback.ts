import { RunicsClient } from "@runics/client";
import { defineCommand } from "citty";
import consola from "consola";
import { resolveConfig } from "../config.js";

const VALID_FEEDBACK_TYPES = ["click", "use", "dismiss", "explicit_good", "explicit_bad"] as const;

export const feedback = defineCommand({
	meta: {
		name: "feedback",
		description: "Submit quality feedback for a search result",
	},
	args: {
		searchEventId: {
			type: "positional",
			description: "Search event ID",
			required: true,
		},
		skillId: {
			type: "positional",
			description: "Skill ID",
			required: true,
		},
		type: {
			type: "positional",
			description: "Feedback type (click, use, dismiss, explicit_good, explicit_bad)",
			required: true,
		},
		position: {
			type: "string",
			description: "Result position (0-indexed)",
			alias: "p",
			default: "0",
		},
		url: {
			type: "string",
			description: "Override API URL",
		},
	},
	async run({ args }) {
		// Validate feedback type
		if (!VALID_FEEDBACK_TYPES.includes(args.type as (typeof VALID_FEEDBACK_TYPES)[number])) {
			consola.error(
				`Invalid feedback type: ${args.type}. Must be one of: ${VALID_FEEDBACK_TYPES.join(", ")}`,
			);
			process.exit(1);
		}

		const config = resolveConfig({
			url: args.url,
		});

		const client = new RunicsClient({
			baseUrl: config.url,
			tenantId: config.tenantId,
		});

		await client.submitFeedback({
			searchEventId: args.searchEventId,
			skillId: args.skillId,
			feedbackType: args.type as (typeof VALID_FEEDBACK_TYPES)[number],
			position: Number.parseInt(args.position, 10),
		});

		consola.success("Feedback submitted successfully");
	},
});
