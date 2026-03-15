import {
	RunicsClient,
	RunicsNetworkError,
	RunicsNotFoundError,
	RunicsValidationError,
} from "@runics/client";
import chalk from "chalk";
import { defineCommand } from "citty";
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
			tenantId: config.tenantId,
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

		// Debug: log the options being sent
		if (process.env.RUNICS_DEBUG) {
			console.error("Search options:", JSON.stringify(options, null, 2));
		}

		// Execute search with error handling
		try {
			const response = await client.findSkill(args.query, options);

			// Check if we got any results
			if (response.results.length === 0) {
				console.log(chalk.yellow("\n⚠️  No skills found for this query."));
				console.log(chalk.dim("\nTry:"));
				console.log(chalk.dim("  • Using different search terms"));
				console.log(chalk.dim("  • Broadening your query"));
				console.log(chalk.dim("  • Lowering the min-trust threshold with --min-trust"));
				return;
			}

			// Format output
			if (args.json) {
				formatJson(response);
			} else if (response.composition?.detected) {
				formatComposition(response.composition);
			} else {
				formatTable(response, { showTrace: args.trace });
			}
		} catch (error) {
			if (error instanceof RunicsNotFoundError) {
				console.error(chalk.red("\n❌ Resource not found"));
				console.log(chalk.dim("\nThe API endpoint may not be available."));
				console.log(chalk.dim(`Check the server URL: ${config.url}`));
				process.exit(1);
			} else if (error instanceof RunicsValidationError) {
				console.error(chalk.red("\n❌ Invalid response from server"));
				console.log(chalk.dim("\nThe server response didn't match the expected format."));
				if (process.env.RUNICS_DEBUG) {
					console.error(error);
				}
				process.exit(1);
			} else if (error instanceof RunicsNetworkError) {
				console.error(chalk.red("\n❌ Network error"));
				console.log(chalk.dim("\nCouldn't connect to the server."));
				console.log(chalk.dim(`Check the server URL: ${config.url}`));
				process.exit(1);
			} else {
				console.error(chalk.red("\n❌ Search failed"));
				console.log(chalk.dim(`\n${error instanceof Error ? error.message : String(error)}`));
				if (process.env.RUNICS_DEBUG) {
					console.error(error);
				}
				process.exit(1);
			}
		}
	},
});
