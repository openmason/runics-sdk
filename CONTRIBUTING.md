# Contributing to Runics SDK

Thank you for your interest in contributing to the Runics SDK! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9.15.0+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/openmason/runics-sdk.git
cd runics-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint
```

## Project Structure

```
runics-sdk/
├── packages/
│   ├── client/      # runics-client SDK
│   └── cli/         # runics CLI
├── .github/         # GitHub Actions workflows
└── docs/            # Documentation
```

## Development Workflow

### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards:
   - Use tabs for indentation (enforced by Biome)
   - Write tests for new features
   - Update documentation as needed
   - Follow TypeScript strict mode

3. **Run checks** before committing:
   ```bash
   pnpm build      # Verify builds
   pnpm test       # Run all tests
   pnpm lint:fix   # Fix linting issues
   ```

4. **Commit your changes** with clear, descriptive messages:
   ```bash
   git commit -m "feat: add support for skill filtering"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new features
   - `fix:` bug fixes
   - `docs:` documentation changes
   - `test:` test additions/changes
   - `chore:` maintenance tasks

5. **Push and create a PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Testing

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test package interactions
- Run tests with: `pnpm test`
- Run tests in watch mode: `pnpm --filter <package> test --watch`

### Code Style

We use Biome for formatting and linting:

```bash
# Check code style
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

## Package-Specific Guidelines

### `runics-client`

- All public APIs must have TypeScript types
- Validate API responses with Zod schemas
- Throw typed errors (extend `RunicsError`)
- Add tests for new client methods
- Update exports in `src/index.ts`

### `runics` (CLI)

- Follow citty command structure
- Add help text for all commands and flags
- Support `--json` output where applicable
- Test with `./test-cli.sh` script
- Update CLI README with new commands

## Pull Request Process

1. **Update documentation** for any API changes
2. **Add tests** for new functionality
3. **Update CHANGELOG.md** with your changes
4. **Ensure CI passes** (builds, tests, lints)
5. **Request review** from maintainers
6. **Address feedback** and update PR

### PR Title Format

Use Conventional Commits format:
- `feat(client): add skill caching support`
- `fix(cli): handle empty search results gracefully`
- `docs: update installation instructions`

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Version information (`runics --version`)
- Environment (Node version, OS)

### Feature Requests

Include:
- Use case and motivation
- Proposed API or CLI interface
- Alternative solutions considered

## Release Process

Releases are managed by maintainers:

1. Update version in package.json files
2. Update CHANGELOG.md
3. Create git tag: `v0.1.0`
4. CI automatically publishes to npm

## Questions?

- Open a [GitHub Discussion](https://github.com/openmason/runics-sdk/discussions)
- Join our [Discord community](https://discord.gg/openmason) (if applicable)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
