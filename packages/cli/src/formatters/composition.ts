import chalk from "chalk";
import type { CompositionResult } from "@runics/client";

export function formatComposition(composition: CompositionResult): void {
	if (!composition.detected) {
		return;
	}

	console.log(chalk.bold(`Composition detected (${composition.parts.length} steps):`));
	console.log();

	for (let i = 0; i < composition.parts.length; i++) {
		const part = composition.parts[i];
		const stepNum = `${i + 1}.`;

		if (part.skill) {
			const skillInfo = `${part.skill.name} (${part.skill.score.toFixed(2)})`;
			console.log(`  ${stepNum} ${part.purpose} → ${chalk.green(skillInfo)}`);
		} else {
			console.log(`  ${stepNum} ${part.purpose} → ${chalk.red("[no match]")}`);
		}
	}

	if (composition.reasoning) {
		console.log();
		console.log(chalk.dim(`Reasoning: ${composition.reasoning}`));
	}
}
