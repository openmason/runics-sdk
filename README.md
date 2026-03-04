# Runics SDK

[![CI](https://github.com/openmason/runics-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/openmason/runics-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm (client)](https://img.shields.io/npm/v/runics-client)](https://www.npmjs.com/package/runics-client)
[![npm (cli)](https://img.shields.io/npm/v/runics)](https://www.npmjs.com/package/runics)

A TypeScript monorepo providing programmatic and CLI access to the Runics semantic skill search API.

## What is Runics?

Runics is a semantic search service for discovering reusable skills across agent registries. This SDK enables AI agent runtimes (Cortex, Bombastic, CoStaff) and human operators to programmatically search, inspect, and integrate skills into their workflows.

## Packages

- **[runics-client](./packages/client/)** — TypeScript SDK for the Runics API
- **[runics](./packages/cli/)** — Command-line interface for querying Runics

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm lint:fix
```

## Requirements

- Node.js 18+
- pnpm 9.15.0+

## Documentation

See [runics-sdk-requirements.md](./runics-sdk-requirements.md) for the full requirements specification.

## License

MIT
