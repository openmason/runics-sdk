import { defineCommand, runMain } from "citty";
import { author } from "./commands/author.js";
import { config } from "./commands/config.js";
import { feedback } from "./commands/feedback.js";
import { inspect } from "./commands/inspect.js";
import { leaderboards } from "./commands/leaderboards.js";
import { mcpServe } from "./commands/mcp-serve.js";
import { search } from "./commands/search.js";

const main = defineCommand({
	meta: {
		name: "runics",
		description: "Runics skill search CLI",
		version: "5.0.0",
	},
	subCommands: {
		search,
		inspect,
		feedback,
		"mcp-serve": mcpServe,
		config,
		leaderboards,
		author,
	},
});

runMain(main);
