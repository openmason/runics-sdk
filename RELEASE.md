# Release Guide

This document describes how to release new versions of the Runics SDK packages.

## Quick Release (Automated)

### Prerequisites

- npm account with publish access
- `NPM_TOKEN` configured in GitHub Secrets
- All tests passing: `pnpm test && pnpm build`

### Steps

```bash
# 1. Update versions (both packages)
npm version patch --workspace=packages/client --workspace=packages/cli

# 2. Update CHANGELOG.md with release notes

# 3. Commit and tag
git add .
git commit -m "chore: release v0.1.1"
git tag v0.1.1

# 4. Push (triggers automated publish)
git push origin main --tags
```

The GitHub Actions workflow automatically publishes to npm and creates a GitHub release.

## Manual Publishing

If automation fails:

```bash
pnpm build

cd packages/client && npm publish --access public
cd ../cli && npm publish --access public
```

## First-Time Setup

### 1. npm Configuration

```bash
npm login
npm whoami  # verify
```

### 2. GitHub Secrets

Generate automation token:
```bash
npm token create --type=automation
```

Add to GitHub:
- Settings → Secrets → Actions → New secret
- Name: `NPM_TOKEN`
- Value: [your token]

### 3. Pre-Release Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] Build successful (`pnpm build`)
- [ ] Linting clean (`pnpm lint`)
- [ ] CHANGELOG.md updated
- [ ] Version numbers bumped
- [ ] Clean git status

## Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features
- **PATCH** (0.0.1): Bug fixes

Pre-1.0.0: Breaking changes increment MINOR version.

## Verification

After publishing:

```bash
# Check npm
npm view runics-client
npm view runics

# Test installation
npm install -g runics
runics --version
```

## Rollback

Deprecate bad version:
```bash
npm deprecate runics-client@0.1.1 "Use 0.1.2 instead"
npm deprecate runics@0.1.1 "Use 0.1.2 instead"
```
