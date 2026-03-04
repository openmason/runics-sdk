import chalk from "chalk";
import Table from "cli-table3";
import type { FindSkillResponse } from "runics-client";

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
		? ["Skill", "Score", "Trust", "Match Source", "Match Text"]
		: ["Skill", "Score", "Trust", "Match Source"];

	const table = new Table({
		head: headers.map((h) => chalk.bold(h)),
		style: {
			head: [],
			border: [],
		},
	});

	for (const result of response.results) {
		const row = [
			result.name,
			result.score.toFixed(2),
			result.trustScore.toFixed(2),
			result.matchSource,
		];

		if (showTrace) {
			row.push(result.matchText || "-");
		}

		table.push(row);
	}

	console.log(table.toString());
}
