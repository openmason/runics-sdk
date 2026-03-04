# @runics/client

[![npm version](https://img.shields.io/npm/v/@runics/client)](https://www.npmjs.com/package/@runics/client)
[![npm downloads](https://img.shields.io/npm/dm/@runics/client)](https://www.npmjs.com/package/@runics/client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK for the Runics semantic skill search API.

## Installation

```bash
npm install @runics/client
```

## Usage

### Basic Search

```typescript
import { RunicsClient } from '@runics/client';

const client = new RunicsClient({
  baseUrl: 'https://runics.example.com'
});

const response = await client.findSkill('check license compliance', {
  limit: 5,
  minTrustScore: 0.7
});

console.log(response.results);
```

### Get Skill Details

```typescript
const skill = await client.getSkill('cargo-deny');
console.log(skill.description);
console.log(skill.agentSummary);
```

### Submit Feedback

```typescript
await client.submitFeedback({
  searchEventId: 'evt_123',
  skillId: 'skill_456',
  feedbackType: 'click',
  position: 0
});
```

### MCP Server

Create an MCP server that exposes Runics as tools for any MCP-compatible agent runtime:

```typescript
import { RunicsClient, createRunicsMcpServer } from '@runics/client';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const client = new RunicsClient();
const server = createRunicsMcpServer(client);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## API Reference

### `RunicsClient`

#### Constructor Options

```typescript
interface RunicsClientOptions {
  baseUrl?: string;           // defaults to http://localhost:8787
  retry?: number;             // max retries, default 3
  retryDelay?: number;        // base delay ms, default 500
  timeout?: number;           // request timeout ms, default 10000
  onRequest?: (ctx) => void;  // request interceptor
  onResponse?: (ctx) => void; // response interceptor
}
```

#### Methods

- `findSkill(query, options?)` — Search for skills by natural language query
- `getSkill(slug)` — Get full skill details by slug
- `submitFeedback(params)` — Submit quality feedback (fire-and-forget)
- `listSkills(options?)` — Paginated skill browsing
- `health()` — Check API health status

### MCP Tools

The MCP server exposes two tools:

- `findSkill` — Search for skills by natural language query
- `getSkillDetails` — Get full details of a skill by its slug

## Error Handling

The SDK throws typed errors:

- `RunicsNetworkError` — Network/timeout errors
- `RunicsRateLimitError` — 429 rate limit (includes retryAfter)
- `RunicsNotFoundError` — 404 not found
- `RunicsServerError` — 5xx server errors
- `RunicsValidationError` — Response validation failed (includes zodErrors)

All errors extend `RunicsError` with `code`, `statusCode`, and `responseBody` properties.

## License

MIT
