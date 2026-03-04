# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-03-03

### Added

#### `runics-client`
- Initial release of TypeScript SDK for Runics semantic skill search API
- Core client methods: `findSkill()`, `getSkill()`, `submitFeedback()`, `listSkills()`, `health()`
- Runtime response validation with Zod schemas
- Typed error hierarchy (NetworkError, RateLimitError, NotFoundError, ServerError, ValidationError)
- Automatic retry with exponential backoff for transient failures
- MCP server factory for exposing Runics as tools to MCP-compatible agents
- Dual ESM/CJS output with full TypeScript declarations
- Comprehensive test coverage (41 tests)

#### `runics` (CLI)
- Command-line interface with 5 commands:
  - `search` - Search for skills by natural language query
  - `inspect` - Display full skill details by slug
  - `feedback` - Submit quality feedback for search results
  - `mcp-serve` - Start local MCP server (stdio or SSE transport)
  - `config` - Show resolved configuration
- Multiple output formats: table, composition view, JSON
- Trace mode for debugging search behavior
- Flexible configuration: CLI flags > env vars > config file > defaults
- Color-coded terminal output with confidence indicators
- Test coverage for config resolution and formatters

#### Infrastructure
- pnpm workspace monorepo with Turborepo orchestration
- Biome for fast linting and formatting
- Vitest for testing
- tsup for efficient bundling
- Full TypeScript strict mode

[unreleased]: https://github.com/openmason/runics-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/openmason/runics-sdk/releases/tag/v0.1.0
