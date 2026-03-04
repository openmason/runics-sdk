import { defineCommand } from "citty";
import { loadConfig } from "../config.js";

export const config = defineCommand({
	meta: {
		name: "config",
		description: "Show resolved configuration",
	},
	args: {},
	async run() {
		const resolvedConfig = loadConfig();

		console.log("Resolved Runics Configuration:");
		console.log(`  URL:         ${resolvedConfig.url}`);
		console.log(
			`  API Key:     ${resolvedConfig.apiKey ? `${resolvedConfig.apiKey.substring(0, 10)}...` : "(not set)"}`,
		);
		console.log(`  Tenant ID:   ${resolvedConfig.tenantId}`);
		console.log(`  Limit:       ${resolvedConfig.defaultLimit}`);
		console.log(`  Min Trust:   ${resolvedConfig.defaultMinTrust}`);
	},
});
