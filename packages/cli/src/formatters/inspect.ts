import type { Skill } from "@runics/client";
import chalk from "chalk";

export function formatInspect(skill: Skill): void {
	// Header
	console.log(chalk.bold.blue(`${skill.name} (v${skill.version})`));
	console.log(
		`Source: ${skill.source} | ` +
			`Trust: ${skill.trustScore.toFixed(2)} | ` +
			`Cognium: ${skill.cogniumScanned ? chalk.green("scanned ✓") : chalk.yellow("not scanned")}`,
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
