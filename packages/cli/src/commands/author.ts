import { RunicsClient } from "@runics/client";
import chalk from "chalk";
import Table from "cli-table3";
import { defineCommand } from "citty";
import { resolveConfig } from "../config.js";
import { formatJson } from "../formatters/json.js";

export const author = defineCommand({
	meta: {
		name: "author",
		description: "View author profile and skills",
	},
	args: {
		handle: {
			type: "positional",
			description: "Author handle (without @)",
			required: true,
		},
		skills: {
			type: "boolean",
			description: "Show author's skills list",
			default: false,
		},
		type: {
			type: "string",
			description: "Filter skills by type (skill, composition, pipeline)",
			alias: "t",
		},
		status: {
			type: "string",
			description: "Filter skills by status (published, deprecated, archived, draft)",
			alias: "s",
		},
		limit: {
			type: "string",
			description: "Number of skills to show (default: 20, max: 100)",
			alias: "l",
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

		const profile = await client.getAuthor(args.handle);

		if (args.json && !args.skills) {
			formatJson(profile);
			return;
		}

		// Display profile
		console.log();
		console.log(
			chalk.bold.blue(
				`@${profile.handle}${profile.displayName ? ` (${profile.displayName})` : ""}`,
			),
		);

		const authorTypeColor =
			profile.authorType === "human"
				? chalk.green
				: profile.authorType === "bot"
					? chalk.cyan
					: chalk.yellow;
		console.log(
			`Type: ${authorTypeColor(profile.authorType)}${profile.botModel ? ` (${profile.botModel})` : ""} | ` +
				`Verified: ${profile.verified ? chalk.green("yes ✓") : chalk.gray("no")}`,
		);

		if (profile.bio) {
			console.log();
			console.log(chalk.italic(profile.bio));
		}

		if (profile.homepageUrl) {
			console.log();
			console.log(`Homepage: ${chalk.underline(profile.homepageUrl)}`);
		}

		console.log();
		console.log(chalk.bold("Stats:"));
		console.log(`  Published skills: ${chalk.yellow(profile.stats.publishedCount)}`);
		console.log(`  Total stars: ${chalk.yellow(profile.stats.totalStars)}`);
		console.log(`  Total forks: ${profile.stats.totalForks}`);
		console.log(`  Total invocations: ${profile.stats.totalInvocations}`);

		console.log();
		console.log(chalk.dim(`Member since: ${profile.createdAt}`));

		// Show skills if requested
		if (args.skills) {
			const skillsOptions = {
				type: args.type as "skill" | "composition" | "pipeline" | undefined,
				status: args.status as "published" | "deprecated" | "archived" | "draft" | undefined,
				limit: args.limit ? Number.parseInt(args.limit, 10) : undefined,
			};

			const skillsResponse = await client.getAuthorSkills(args.handle, skillsOptions);

			if (args.json) {
				formatJson(skillsResponse);
				return;
			}

			console.log();
			console.log(
				chalk.bold.blue(
					`\nSKILLS BY @${args.handle} (${skillsResponse.skills.length} shown)\n`,
				),
			);

			if (skillsResponse.skills.length === 0) {
				console.log(chalk.yellow("No skills found"));
				return;
			}

			const table = new Table({
				head: [
					chalk.bold("Name"),
					chalk.bold("Type"),
					chalk.bold("Status"),
					chalk.bold("Trust"),
					chalk.bold("Stars"),
					chalk.bold("Invocations"),
					chalk.bold("Tags"),
				],
				style: {
					head: [],
					border: [],
				},
				wordWrap: true,
				colWidths: [25, 12, 12, 7, 7, 12, 20],
			});

			for (const skill of skillsResponse.skills) {
				const statusColor =
					skill.status === "published"
						? chalk.green
						: skill.status === "deprecated"
							? chalk.yellow
							: skill.status === "archived"
								? chalk.red
								: chalk.gray;

				const tags = skill.tags.length === 0 ? "-" : skill.tags.slice(0, 2).join(", ");

				table.push([
					skill.name,
					skill.skillType,
					statusColor(skill.status),
					skill.trustScore.toFixed(2),
					skill.humanStarCount,
					skill.agentInvocationCount,
					tags,
				]);
			}

			console.log(table.toString());
		}
	},
});
