import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { defineCommand } from "citty";
import consola from "consola";
import { RunicsClient, createRunicsMcpServer } from "runics-client";
import { resolveConfig } from "../config.js";

export const mcpServe = defineCommand({
	meta: {
		name: "mcp-serve",
		description: "Start a local MCP server exposing Runics tools",
	},
	args: {
		transport: {
			type: "string",
			description: "Transport type (stdio or sse)",
			default: "stdio",
		},
		port: {
			type: "string",
			description: "Port for SSE transport",
			default: "3100",
		},
		url: {
			type: "string",
			description: "Override API URL",
		},
	},
	async run({ args }) {
		const config = resolveConfig({
			url: args.url,
		});

		const client = new RunicsClient({
			baseUrl: config.url,
		});

		const server = createRunicsMcpServer(client, {
			serverName: "runics",
			serverVersion: "0.1.0",
		});

		if (args.transport === "stdio") {
			const transport = new StdioServerTransport();
			await server.connect(transport);
			consola.info("Runics MCP server started on stdio");
		} else if (args.transport === "sse") {
			const port = Number.parseInt(args.port, 10);
			const transport = new SSEServerTransport("/message", {
				port,
			});
			await server.connect(transport);
			consola.info(`Runics MCP server started on SSE at port ${port}`);
		} else {
			consola.error(`Invalid transport type: ${args.transport}. Must be stdio or sse.`);
			process.exit(1);
		}

		// Keep process alive
		await new Promise(() => {});
	},
});
