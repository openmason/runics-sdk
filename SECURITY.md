# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. Do Not Open a Public Issue

Please do not report security vulnerabilities through public GitHub issues.

### 2. Report Privately

Email security reports to: **security@openmason.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity (see below)

### Severity Levels

- **Critical**: Fix within 24-48 hours
- **High**: Fix within 7 days
- **Medium**: Fix within 30 days
- **Low**: Fix in next regular release

## Security Best Practices

When using the Runics SDK:

### API Keys

- Never commit API keys to version control
- Use environment variables: `RUNICS_API_KEY`
- Store keys securely in production (e.g., secret managers)

### Dependencies

- Regularly update dependencies: `pnpm update`
- Monitor security advisories: `pnpm audit`

### Configuration Files

- Don't commit `.runicsrc.json` with sensitive data
- Add to `.gitignore` if it contains credentials

## Disclosure Policy

- Security issues will be disclosed after a fix is available
- We will credit researchers who report valid vulnerabilities
- Coordinated disclosure: 90 days from report to public disclosure

## Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes in CHANGELOG.md
- npm package updates

## Acknowledgments

We thank the security research community for helping keep Runics SDK secure.
