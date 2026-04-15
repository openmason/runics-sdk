import { RunicsClient } from "@runics/client";
import chalk from "chalk";
import Table from "cli-table3";
import { defineCommand } from "citty";
import { resolveConfig } from "../config.js";
import { formatJson } from "../formatters/json.js";

export const leaderboards = defineCommand({
	meta: {
		name: "leaderboards",
		description: "View skill leaderboards (human, agents, trending, most-composed)",
	},
	args: {
		board: {
			type: "positional",
			description: "Leaderboard type: human, agents, trending, most-composed",
			required: true,
		},
		type: {
			type: "string",
			description: "Filter by skill type (skill, composition, pipeline)",
			alias: "t",
		},
		category: {
			type: "string",
			description: "Filter by category",
			alias: "c",
		},
		ecosystem: {
			type: "string",
			description: "Filter by ecosystem",
			alias: "e",
		},
		limit: {
			type: "string",
			description: "Number of results (default: 20, max: 100)",
			alias: "l",
		},
		offset: {
			type: "string",
			description: "Offset for pagination (default: 0)",
			alias: "o",
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
		const config = resolveConfig({ url: args.url });
		const client = new RunicsClient({
			baseUrl: config.url,
			tenantId: config.tenantId,
		});

		const options = {
			type: args.type,
			category: args.category,
			ecosystem: args.ecosystem,
			limit: args.limit ? Number.parseInt(args.limit, 10) : undefined,
			offset: args.offset ? Number.parseInt(args.offset, 10) : undefined,
		};

		let response;
		switch (args.board) {
			case "human":
				response = await client.getHumanLeaderboard(options);
				break;
			case "agents":
				response = await client.getAgentLeaderboard(options);
				break;
			case "trending":
				response = await client.getTrendingLeaderboard(options);
				break;
			case "most-composed":
				response = await client.getMostComposedLeaderboard(options);
				break;
			default:
				console.error(
					chalk.red(
						`Invalid leaderboard type: ${args.board}. Choose: human, agents, trending, most-composed`,
					),
				);
				process.exit(1);
		}

		if (args.json) {
			formatJson(response);
			return;
		}

		// Format as table
		console.log(chalk.bold.blue(`\n${args.board.toUpperCase()} LEADERBOARD\n`));

		if (response.leaderboard.length === 0) {
			console.log(chalk.yellow("No results found"));
			return;
		}

		const table = new Table({
			head: [
				chalk.bold("Rank"),
				chalk.bold("Skill"),
				chalk.bold("Author"),
				chalk.bold("Score"),
				chalk.bold("Trust"),
				chalk.bold("Stars"),
				chalk.bold("Invocations"),
				chalk.bold("Error%"),
			],
			style: {
				head: [],
				border: [],
			},
			wordWrap: true,
			colWidths: [6, 25, 15, 8, 7, 7, 12, 8],
		});

		for (const [index, entry] of response.leaderboard.entries()) {
			const rank = (options.offset || 0) + index + 1;
			const author = entry.authorHandle ? `@${entry.authorHandle}` : chalk.gray("unknown");
			const stars = entry.humanStarCount !== undefined ? entry.humanStarCount : "-";
			const invocations =
				entry.agentInvocationCount !== undefined ? entry.agentInvocationCount : "-";
			const errorRate =
				entry.errorRate != null
					? entry.errorRate > 0.1
						? chalk.red((entry.errorRate * 100).toFixed(1))
						: chalk.green((entry.errorRate * 100).toFixed(1))
					: "-";

			table.push([
				rank,
				entry.name,
				author,
				entry.score.toFixed(2),
				entry.trustScore.toFixed(2),
				stars,
				invocations,
				errorRate,
			]);
		}

		console.log(table.toString());
	},
});
