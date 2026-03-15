import type { Skill } from "@runics/client";
import chalk from "chalk";

export function formatInspect(skill: Skill): void {
	// Header
	const typeIndicator = skill.type ? ` [${skill.type.toUpperCase()}]` : "";
	const statusColor =
		skill.status === "published"
			? chalk.green
			: skill.status === "deprecated"
				? chalk.yellow
				: skill.status === "archived"
					? chalk.red
					: skill.status === "vulnerable" || skill.status === "contains-vulnerable"
						? chalk.magenta
						: skill.status === "revoked"
							? chalk.red.bold
							: skill.status === "degraded"
								? chalk.yellow
								: chalk.gray;
	const statusIndicator = skill.status ? ` ${statusColor(skill.status)}` : "";

	console.log(chalk.bold.blue(`${skill.name} (v${skill.version})${typeIndicator}${statusIndicator}`));

	// v5 fields
	const verificationTierColor =
		skill.verificationTier === "certified"
			? chalk.green.bold
			: skill.verificationTier === "verified"
				? chalk.green
				: skill.verificationTier === "scanned"
					? chalk.yellow
					: chalk.gray;
	const verificationDisplay = skill.verificationTier
		? ` | Verification: ${verificationTierColor(skill.verificationTier)}`
		: "";
	const trustBadgeDisplay = skill.trustBadge
		? ` | Badge: ${chalk.cyan(skill.trustBadge)}`
		: "";

	console.log(
		`Source: ${skill.source} | ` +
			`Trust: ${skill.trustScore.toFixed(2)}${verificationDisplay}${trustBadgeDisplay}`,
	);
	console.log();

	// Description
	console.log(chalk.bold("Description:"));
	console.log(`  ${skill.description}`);
	console.log();

	// Agent Summary
	console.log(chalk.bold("Agent Summary:"));
	console.log(`  ${skill.agentSummary}`);
	console.log();

	// Author Information
	if (skill.authorHandle) {
		console.log(chalk.bold("Author:"));
		const authorType = skill.authorType ? ` (${skill.authorType})` : "";
		console.log(`  @${skill.authorHandle}${authorType}`);
		console.log();
	}

	// v5 Skill Type
	if (skill.skillType) {
		console.log(chalk.bold("Skill Type:"));
		console.log(`  ${skill.skillType}`);
		console.log();
	}

	// Tags & Category
	if (skill.tags && skill.tags.length > 0) {
		console.log(chalk.bold("Tags:"));
		console.log(`  ${skill.tags.join(", ")}`);
		console.log();
	}

	if (skill.category) {
		console.log(chalk.bold("Category:"));
		console.log(`  ${skill.category}`);
		console.log();
	}

	// v5 Revocation Information
	if (skill.status === "revoked" && skill.revokedReason) {
		console.log(chalk.bold.red("Revocation Information:"));
		console.log(`  Reason: ${skill.revokedReason}`);
		if (skill.remediationMessage) {
			console.log(`  Remediation: ${skill.remediationMessage}`);
		}
		if (skill.remediationUrl) {
			console.log(`  URL: ${chalk.underline(skill.remediationUrl)}`);
		}
		console.log();
	}

	// Fork Information
	if (skill.forkOf) {
		console.log(chalk.bold("Fork Information:"));
		console.log(`  Forked from: ${skill.forkOf}`);
		if (skill.forkDepth !== undefined) {
			console.log(`  Fork depth: ${skill.forkDepth}`);
		}
		console.log();
	}

	// Social Metrics
	const hasMetrics =
		skill.humanStarCount !== undefined ||
		skill.humanForkCount !== undefined ||
		skill.agentInvocationCount !== undefined ||
		skill.compositionInclusionCount !== undefined;

	if (hasMetrics) {
		console.log(chalk.bold("Metrics:"));
		if (skill.humanStarCount !== undefined) {
			console.log(`  Stars: ${chalk.yellow(skill.humanStarCount)}`);
		}
		if (skill.humanForkCount !== undefined) {
			console.log(`  Human forks: ${skill.humanForkCount}`);
		}
		if (skill.botForkCount !== undefined) {
			console.log(`  Bot forks: ${skill.botForkCount}`);
		}
		if (skill.humanCopyCount !== undefined) {
			console.log(`  Human copies: ${skill.humanCopyCount}`);
		}
		if (skill.agentInvocationCount !== undefined) {
			console.log(`  Agent invocations: ${skill.agentInvocationCount}`);
		}
		if (skill.compositionInclusionCount !== undefined) {
			console.log(`  Used in compositions: ${skill.compositionInclusionCount}`);
		}
		console.log();
	}

	// Performance Metrics
	const hasPerformanceMetrics =
		skill.avgExecutionTimeMs !== undefined ||
		skill.errorRate !== undefined ||
		skill.runCount !== undefined ||
		skill.lastRunAt !== undefined;

	if (hasPerformanceMetrics) {
		console.log(chalk.bold("Performance:"));
		if (skill.avgExecutionTimeMs !== undefined) {
			console.log(`  Avg execution time: ${skill.avgExecutionTimeMs.toFixed(0)}ms`);
		}
		if (skill.errorRate !== undefined) {
			const errorColor = skill.errorRate > 0.1 ? chalk.red : chalk.green;
			console.log(`  Error rate: ${errorColor((skill.errorRate * 100).toFixed(1) + "%")}`);
		}
		if (skill.runCount !== undefined) {
			console.log(`  Run count: ${skill.runCount}`);
		}
		if (skill.lastRunAt) {
			console.log(`  Last run: ${skill.lastRunAt}`);
		}
		console.log();
	}

	// Capabilities
	if (skill.capabilitiesRequired.length > 0) {
		console.log(chalk.bold("Capabilities Required:"));
		console.log(`  ${skill.capabilitiesRequired.join(", ")}`);
		console.log();
	}

	// Execution Layer
	console.log(chalk.bold("Execution Layer:"));
	console.log(`  ${skill.executionLayer}`);
	console.log();

	// Auth Requirements
	console.log(chalk.bold("Auth:"));
	if (skill.authRequirements) {
		console.log(`  ${JSON.stringify(skill.authRequirements, null, 2)}`);
	} else {
		console.log("  none required");
	}
	console.log();

	// Install Method
	if (skill.installMethod) {
		console.log(chalk.bold("Install:"));
		console.log(`  ${JSON.stringify(skill.installMethod, null, 2)}`);
		console.log();
	}

	// Schema
	if (skill.schemaJson) {
		console.log(chalk.bold("Schema:"));
		const schemaStr = JSON.stringify(skill.schemaJson, null, 2);
		// Truncate if too long
		if (schemaStr.length > 500) {
			console.log(`  ${schemaStr.substring(0, 500)}...`);
		} else {
			console.log(`  ${schemaStr}`);
		}
		console.log();
	}

	// Cognium Report
	if (skill.cogniumReport) {
		console.log(chalk.bold("Cognium Report:"));
		console.log(`  ${JSON.stringify(skill.cogniumReport, null, 2)}`);
		console.log();
	}

	// Metadata
	console.log(chalk.dim(`Created: ${skill.createdAt} | Updated: ${skill.updatedAt}`));
}
