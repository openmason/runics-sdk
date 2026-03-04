# CLI Usage Guide

This guide shows you how to run the Runics CLI in different scenarios.

## 🏗️ Development Mode (Before Publishing)

### Method 1: Direct Node Execution (Recommended)

```bash
# From repository root
node packages/cli/dist/index.js --help
node packages/cli/dist/index.js config
node packages/cli/dist/index.js search "check licenses"

# Make sure packages are built first
pnpm build
```

### Method 2: Using Convenience Wrapper

Create a simple wrapper script:

```bash
#!/usr/bin/env bash
# Save as: runics.sh
node packages/cli/dist/index.js "$@"
```

Make it executable and use it:

```bash
chmod +x runics.sh
./runics.sh --help
./runics.sh search "deploy to workers"
./runics.sh config
```

### Method 3: npm link (Global Install from Local)

Install your local CLI globally for testing:

```bash
cd packages/cli
npm link

# Now use it globally
runics --help
runics search "test query"

# Unlink when done
npm unlink -g runics
```

---

## 📦 Production Mode (After Publishing)

### Method 1: Global Install (Recommended)

```bash
# Install globally from npm
npm install -g runics

# Use from anywhere
runics --help
runics search "check licenses" --limit 10
runics inspect cargo-deny
runics config

# Update to latest version
npm update -g runics

# Uninstall
npm uninstall -g runics
```

### Method 2: npx (No Install Required)

```bash
# Run directly without installing
npx runics --help
npx runics search "deploy cloudflare"
npx runics config

# Always use latest version
npx runics@latest search "test"
```

### Method 3: Project-Local Install

```bash
# Install in a specific project
npm install runics

# Run with npx
npx runics search "test"

# Or add to package.json scripts
{
  "scripts": {
    "find-skill": "runics search"
  }
}

# Run via npm
npm run find-skill "check licenses"
```

---

## 🎯 Common Commands

### Search for Skills

```bash
# Basic search
runics search "check license compliance"

# With options
runics search "deploy to cloudflare" --limit 10 --min-trust 0.8

# Show debug trace
runics search "lint rust code" --trace

# JSON output for scripting
runics search "run tests" --json | jq '.results[0].name'

# Override API URL
runics search "test" --url https://api.runics.example.com
```

### Inspect Skill Details

```bash
# Get full skill details
runics inspect cargo-deny

# JSON output
runics inspect cargo-deny --json
```

### Submit Feedback

```bash
# Submit feedback
runics feedback evt_123 skill_456 click --position 0

# Feedback types: click, use, dismiss, explicit_good, explicit_bad
runics feedback evt_123 skill_456 explicit_good
```

### MCP Server

```bash
# Start MCP server (stdio mode)
runics mcp-serve

# SSE mode on custom port
runics mcp-serve --transport sse --port 3100
```

### Configuration

```bash
# Show current config
runics config

# Set via environment
RUNICS_URL=https://api.example.com runics config

# Or create config file
echo '{"url": "https://api.example.com"}' > .runicsrc.json
runics config
```

---

## ⚙️ Configuration Priority

Configuration is resolved in this order (highest to lowest):

1. **CLI flags** - `--url`, `--limit`, etc.
2. **Environment variables** - `RUNICS_URL`, `RUNICS_API_KEY`
3. **Config file** - `.runicsrc.json` in current directory or home
4. **Defaults** - `http://localhost:8787`, limit=5, etc.

### Config File Example

Create `.runicsrc.json`:

```json
{
  "url": "https://runics.example.com",
  "apiKey": "rk_your_api_key",
  "defaultLimit": 10,
  "defaultMinTrust": 0.7
}
```

**Note:** Don't commit config files with API keys! Add to `.gitignore`.

---

## 🔧 Troubleshooting

### "command not found: runics"

**After global install:**
```bash
# Verify installation
npm list -g runics

# Check npm global bin directory is in PATH
npm config get prefix

# Add to PATH if needed (macOS/Linux)
echo 'export PATH="$(npm config get prefix)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Development mode:**
```bash
# Use full path or wrapper script
node packages/cli/dist/index.js --help
./runics.sh --help
```

### "Cannot find module 'runics-client'"

The CLI package depends on the client. Make sure both are built:

```bash
pnpm build
```

### API Connection Errors

```bash
# Check API URL
runics config

# Test with specific URL
runics search "test" --url https://your-api.example.com

# Set via environment
export RUNICS_URL=https://your-api.example.com
runics search "test"
```

---

## 📚 Examples

### Basic Workflow

```bash
# Search for skills
runics search "check licenses" --limit 5

# Get details on a specific skill
runics inspect cargo-deny

# Use with real API
runics search "deploy workers" --url https://api.runics.example.com
```

### Scripting

```bash
#!/bin/bash
# Find and display top skill for a query

QUERY="$1"
SKILL=$(runics search "$QUERY" --json | jq -r '.results[0].slug')

if [ -n "$SKILL" ]; then
  echo "Top result: $SKILL"
  runics inspect "$SKILL"
else
  echo "No results found"
fi
```

### With MCP-Compatible Agents

```bash
# Start MCP server
runics mcp-serve

# Or for networked agents
runics mcp-serve --transport sse --port 3100
```

---

## 🚀 Quick Reference

```bash
# Development
pnpm build                                    # Build CLI first
node packages/cli/dist/index.js <command>     # Run CLI

# After publishing
npm install -g runics                         # Install
runics search "query"                         # Search
runics inspect <slug>                         # Get details
runics config                                 # Show config
runics --help                                 # Get help
```
