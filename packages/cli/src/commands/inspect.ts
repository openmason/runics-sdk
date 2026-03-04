import { RunicsClient } from "@runics/client";
import { defineCommand } from "citty";
import { resolveConfig } from "../config.js";
import { formatInspect } from "../formatters/inspect.js";
import { formatJson } from "../formatters/json.js";

export const inspect = defineCommand({
	meta: {
		name: "inspect",
		description: "Display full skill details by slug",
	},
	args: {
		slug: {
			type: "positional",
			description: "Skill slug identifier",
			required: true,
		},
		json: {
			type: "boolean",
			description: "Output raw JSON",
			default: false,
		},
		url: {
			type: "string",
			description: "Override API URL",
		},
	},
	async run({ args }) {
		const config = resolveConfig({
			url: args.url,
		});

		const client = new RunicsClient({
			baseUrl: config.url,
			tenantId: config.tenantId,
		});

		const skill = await client.getSkill(args.slug);

		if (args.json) {
			formatJson(skill);
		} else {
			formatInspect(skill);
		}
	},
});
