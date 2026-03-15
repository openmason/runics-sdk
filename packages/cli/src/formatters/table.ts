import type { FindSkillResponse } from "@runics/client";
import chalk from "chalk";
import Table from "cli-table3";

export interface TableFormatterOptions {
	showTrace?: boolean;
}

export function formatTable(
	response: FindSkillResponse,
	options: TableFormatterOptions = {},
): void {
	const { showTrace = false } = options;

	// Header line with query info
	const confidenceColor =
		response.confidence === "high"
			? chalk.green
			: response.confidence === "medium"
				? chalk.yellow
				: chalk.red;

	console.log(
		`Confidence: ${confidenceColor(response.confidence)} | ` +
			`Tier: ${response.meta.tier} | ` +
			`Time: ${response.meta.latencyMs}ms | ` +
			`Cache: ${response.meta.cacheHit ? "hit" : "miss"}`,
	);

	// Show trace information if requested
	if (showTrace && response.searchTrace) {
		console.log();
		console.log(chalk.bold("Search Trace:"));
		console.log(`Original Query: ${response.searchTrace.originalQuery}`);

		if (response.searchTrace.alternateQueries && response.searchTrace.alternateQueries.length > 0) {
			console.log(`Alternate Queries: ${response.searchTrace.alternateQueries.join(", ")}`);
		}

		if (response.searchTrace.terminologyMap) {
			const mappings = Object.entries(response.searchTrace.terminologyMap)
				.map(([k, v]) => `${k} → ${v}`)
				.join(", ");
			console.log(`Terminology Map: ${mappings}`);
		}

		if (response.searchTrace.reasoning) {
			console.log(`Reasoning: ${response.searchTrace.reasoning}`);
		}

		console.log(`LLM Invoked: ${response.meta.llmInvoked ? "yes" : "no"}`);
	}

	console.log();

	// Results table
	if (response.results.length === 0) {
		console.log(chalk.yellow("No results found"));
		return;
	}

	const headers = showTrace
		? ["Skill", "Summary", "Score", "Trust", "Author", "Tags", "Stars", "Error%", "Match Source", "Match Text"]
		: ["Skill", "Summary", "Score", "Trust", "Author", "Tags", "Stars", "Error%"];

	const table = new Table({
		head: headers.map((h) => chalk.bold(h)),
		style: {
			head: [],
			border: [],
		},
		wordWrap: true,
		colWidths: showTrace ? [20, 30, 6, 6, 12, 12, 6, 7, 13, 18] : [20, 30, 6, 6, 12, 12, 6, 7],
	});

	for (const result of response.results) {
		// Format author
		const author = result.authorHandle
			? result.authorType === "bot"
				? chalk.cyan(`@${result.authorHandle}`)
				: `@${result.authorHandle}`
			: chalk.gray("unknown");

		// Format tags
		const tags = result.tags
			? result.tags.length === 0
				? chalk.gray("none")
				: result.tags.slice(0, 2).join(", ") + (result.tags.length > 2 ? "..." : "")
			: chalk.gray("none");

		// Format stars
		const stars = result.humanStarCount !== undefined ? result.humanStarCount.toString() : "-";

		// Format error rate
		const errorRate =
			result.errorRate !== undefined
				? result.errorRate > 0.1
					? chalk.red((result.errorRate * 100).toFixed(1))
					: chalk.green((result.errorRate * 100).toFixed(1))
				: "-";

		const row = [
			result.name,
			result.agentSummary || chalk.gray("(no summary)"),
			result.score.toFixed(2),
			result.trustScore.toFixed(2),
			author,
			tags,
			stars,
			errorRate,
		];

		if (showTrace) {
			row.push(result.matchSource);
			row.push(result.matchText || "-");
		}

		table.push(row);
	}

	console.log(table.toString());
}
