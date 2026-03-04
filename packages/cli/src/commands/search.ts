import { defineCommand } from "citty";
import { RunicsClient } from "runics-client";
import { resolveConfig } from "../config.js";
import { formatComposition } from "../formatters/composition.js";
import { formatJson } from "../formatters/json.js";
import { formatTable } from "../formatters/table.js";

export const search = defineCommand({
	meta: {
		name: "search",
		description: "Search for skills by natural language query",
	},
	args: {
		query: {
			type: "positional",
			description: "Natural language query",
			required: true,
		},
		limit: {
			type: "string",
			description: "Maximum number of results",
			alias: "l",
		},
		"min-trust": {
			type: "string",
			description: "Minimum trust score (0.0-1.0)",
			alias: "t",
		},
		"max-tier": {
			type: "string",
			description: "Cap search tier (1, 2, or 3)",
		},
		trace: {
			type: "boolean",
			description: "Show full search trace and debug info",
			default: false,
		},
		json: {
			type: "boolean",
			description: "Output raw JSON",
			default: false,
		},
		"execution-layer": {
			type: "string",
			description: "Filter by execution layer",
		},
		url: {
			type: "string",
			description: "Override API URL",
		},
	},
	async run({ args }) {
		// Resolve config with CLI flag overrides
		const config = resolveConfig({
			url: args.url,
			limit: args.limit ? Number.parseInt(args.limit, 10) : undefined,
			minTrust: args["min-trust"] ? Number.parseFloat(args["min-trust"]) : undefined,
		});

		// Create client
		const client = new RunicsClient({
			baseUrl: config.url,
		});

		// Build search options
		const options = {
			limit: args.limit ? Number.parseInt(args.limit, 10) : config.defaultLimit,
			minTrustScore: args["min-trust"]
				? Number.parseFloat(args["min-trust"])
				: config.defaultMinTrust,
			maxTier: args["max-tier"] ? (Number.parseInt(args["max-tier"], 10) as 1 | 2 | 3) : undefined,
			executionLayer: args["execution-layer"],
		};

		// Execute search
		const response = await client.findSkill(args.query, options);

		// Format output
		if (args.json) {
			formatJson(response);
		} else if (response.composition?.detected) {
			formatComposition(response.composition);
		} else {
			formatTable(response, { showTrace: args.trace });
		}
	},
});
