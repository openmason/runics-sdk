import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { RunicsClient } from "./client.js";

export interface McpServerOptions {
	serverName?: string;
	serverVersion?: string;
}

export function createRunicsMcpServer(client: RunicsClient, options?: McpServerOptions): Server {
	const server = new Server(
		{
			name: options?.serverName || "runics",
			version: options?.serverVersion || "0.1.0",
		},
		{
			capabilities: {
				tools: {},
			},
		},
	);

	// Register findSkill tool
	// @ts-expect-error - MCP SDK type definitions may vary across versions
	server.setRequestHandler("tools/list", async () => {
		return {
			tools: [
				{
					name: "findSkill",
					description: "Search for reusable skills by natural language query",
					inputSchema: {
						type: "object",
						properties: {
							query: {
								type: "string",
								description: "Natural language query to search for skills",
							},
							limit: {
								type: "number",
								description: "Maximum number of results to return",
							},
							minTrustScore: {
								type: "number",
								description: "Minimum trust score threshold (0.0-1.0)",
							},
						},
						required: ["query"],
					},
				},
				{
					name: "getSkillDetails",
					description: "Get full details of a skill by its slug",
					inputSchema: {
						type: "object",
						properties: {
							slug: {
								type: "string",
								description: "The slug identifier of the skill",
							},
						},
						required: ["slug"],
					},
				},
			],
		};
	});

	// Register tool call handler
	// @ts-expect-error - MCP SDK type definitions may vary across versions
	server.setRequestHandler("tools/call", async (request) => {
		const { name, arguments: args } = request.params as {
			name: string;
			arguments: Record<string, unknown>;
		};

		try {
			if (name === "findSkill") {
				const result = await client.findSkill(args.query as string, {
					limit: args.limit as number | undefined,
					minTrustScore: args.minTrustScore as number | undefined,
				});
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}

			if (name === "getSkillDetails") {
				const result = await client.getSkill(args.slug as string);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			}

			throw new Error(`Unknown tool: ${name}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});

	return server;
}
