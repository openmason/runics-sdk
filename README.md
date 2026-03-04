# Runics SDK

[![CI](https://github.com/openmason/runics-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/openmason/runics-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm (client)](https://img.shields.io/npm/v/@runics/client)](https://www.npmjs.com/package/@runics/client)
[![npm (cli)](https://img.shields.io/npm/v/@runics/cli)](https://www.npmjs.com/package/@runics/cli)

A TypeScript monorepo providing programmatic and CLI access to the Runics semantic skill search API.

## What is Runics?

Runics is a semantic search service for discovering reusable skills across agent registries. This SDK enables AI agent runtimes (Cortex, Bombastic, CoStaff) and human operators to programmatically search, inspect, and integrate skills into their workflows.

## Packages

- **[@runics/client](./packages/client/)** — TypeScript SDK for the Runics API
- **[@runics/cli](./packages/cli/)** — Command-line interface for querying Runics

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

- [CLI Usage Guide](./CLI-USAGE.md) - Comprehensive CLI documentation
- [CHANGELOG](./CHANGELOG.md) - Release history and changes
- [CONTRIBUTING](./CONTRIBUTING.md) - Contribution guidelines
- [Client Package README](./packages/client/README.md) - SDK documentation
- [CLI Package README](./packages/cli/README.md) - CLI documentation

## Published Packages

- npm: [@runics/client](https://www.npmjs.com/package/@runics/client)
- npm: [@runics/cli](https://www.npmjs.com/package/@runics/cli)

## License

MIT
