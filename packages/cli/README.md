# runics

[![npm version](https://img.shields.io/npm/v/runics)](https://www.npmjs.com/package/runics)
[![npm downloads](https://img.shields.io/npm/dm/runics)](https://www.npmjs.com/package/runics)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Command-line interface for the Runics semantic skill search API.

## Installation

```bash
npm install -g runics
```

## Quick Start

```bash
# Search for skills
runics search "check license compliance"

# Get detailed skill info
runics inspect cargo-deny

# Show configuration
runics config
```

## Commands

### `runics search <query>`

Search for skills by natural language query.

**Options:**
- `--limit, -l <number>` — Max results (default: 5)
- `--min-trust, -t <number>` — Minimum trust score 0.0-1.0 (default: 0.0)
- `--max-tier <1|2|3>` — Cap search tier to skip LLM invocation
- `--trace` — Show full search trace and debug info
- `--json` — Output raw JSON for piping
- `--execution-layer <layer>` — Filter by execution layer
- `--url <url>` — Override API URL

**Example:**

```bash
runics search "lint rust code" --limit 3 --trace
```

### `runics inspect <slug>`

Display full skill details by slug.

**Options:**
- `--json` — Output raw JSON
- `--url <url>` — Override API URL

**Example:**

```bash
runics inspect cargo-deny
```

### `runics feedback <event-id> <skill-id> <type>`

Submit quality feedback for a search result.

**Type values:** `click`, `use`, `dismiss`, `explicit_good`, `explicit_bad`

**Options:**
- `--position, -p <number>` — Result position (default: 0)
- `--url <url>` — Override API URL

**Example:**

```bash
runics feedback evt_123 skill_456 click --position 0
```

### `runics mcp-serve`

Start a local MCP server exposing Runics tools.

**Options:**
- `--transport <stdio|sse>` — Transport type (default: stdio)
- `--port <number>` — Port for SSE transport (default: 3100)
- `--url <url>` — Override API URL

**Example:**

```bash
# Use with Claude Code or any MCP-compatible agent
runics mcp-serve

# SSE mode for networked agents
runics mcp-serve --transport sse --port 3100
```

### `runics config`

Show resolved configuration (helpful for debugging).

## Configuration

Priority order (highest wins):
1. CLI flags
2. Environment variables
3. Config file

### Config File

Create `.runicsrc.json` in your current directory or home directory:

```json
{
  "url": "https://runics.example.com",
  "apiKey": "rk_...",
  "defaultLimit": 5,
  "defaultMinTrust": 0.0
}
```

### Environment Variables

- `RUNICS_URL` — API endpoint URL
- `RUNICS_API_KEY` — API key for authentication (future)

## Examples

### Basic search with custom limits

```bash
runics search "deploy to cloudflare workers" --limit 10 --min-trust 0.8
```

### Debug search trace

```bash
runics search "fix security issues" --trace
```

### JSON output for scripting

```bash
runics search "run tests" --json | jq '.results[0].name'
```

### Inspect skill details

```bash
runics inspect fossa-scan
```

## License

MIT
