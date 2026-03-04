# Next Steps - Ready to Launch! 🚀

Your Runics SDK is committed and tagged. Follow these steps to publish.

## Step 1: Push to GitHub

```bash
# Add your GitHub remote (update URL if needed)
git remote add origin https://github.com/openmason/runics-sdk.git

# Push code and tags
git push -u origin main
git push origin --tags
```

**Or create a new repo on GitHub first:**
1. Go to https://github.com/new
2. Repository name: `runics-sdk`
3. Description: "TypeScript SDK and CLI for Runics semantic skill search"
4. Public repository
5. **Don't** initialize with README, .gitignore, or license (we have them)
6. Create repository
7. Follow the "push an existing repository" commands

## Step 2: Configure npm Publishing

### A. Create npm Account (if needed)
```bash
# Sign up at https://www.npmjs.com/signup
# Or login
npm login
npm whoami  # Verify you're logged in
```

### B. Generate npm Token
```bash
# Create automation token for GitHub Actions
npm token create --type=automation
```

Copy the token that starts with `npm_...`

### C. Add Token to GitHub Secrets
1. Go to your GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Secret: Paste your npm token
6. Click "Add secret"

## Step 3: Verify CI is Running

After pushing, check GitHub Actions:
1. Go to your repo → Actions tab
2. You should see "CI" workflow running
3. Wait for it to complete (should be green ✓)

## Step 4: Publish to npm

### Option A: Automatic (Recommended)

The tag `v0.1.0` will trigger automatic publishing:
- GitHub Actions will run tests
- Build both packages
- Publish to npm
- Create GitHub release

**Check progress:**
- Actions tab → "Publish" workflow
- Wait ~2-3 minutes for completion

### Option B: Manual Publishing

If you prefer manual control:

```bash
# Build packages
pnpm build

# Publish client SDK
cd packages/client
npm publish --access public

# Publish CLI
cd ../cli
npm publish --access public
```

## Step 5: Verify Publication

### Check npm
```bash
npm view runics-client
npm view runics
```

### Test Installation
```bash
# Test SDK
npm install runics-client
node -e "const {RunicsClient} = require('runics-client'); console.log('✓ SDK works!');"

# Test CLI
npm install -g runics
runics --version
runics config
```

## Step 6: Update Repository Settings (Optional)

### Add Topics
Go to repo → About (gear icon) → Add topics:
- typescript
- sdk
- cli
- semantic-search
- mcp
- skills
- api-client

### Enable Discussions (Optional)
Settings → General → Features → Discussions

### Branch Protection
Settings → Branches → Add rule:
- Branch name pattern: `main`
- ✓ Require pull request reviews
- ✓ Require status checks (CI)

## Troubleshooting

### GitHub Push Issues
```bash
# If remote already exists
git remote remove origin
git remote add origin https://github.com/openmason/runics-sdk.git
```

### npm Publish Permission
- Verify you're logged in: `npm whoami`
- Check package names aren't taken: `npm view runics-client`, `npm view runics`
- If taken, update package names in package.json files

### CI Failures
- Check Actions tab for error details
- Common issues: npm token not set, Node version mismatch
- Re-run failed jobs after fixing

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] CI passing (green checkmark in Actions)
- [ ] NPM_TOKEN added to GitHub Secrets
- [ ] Packages published to npm
- [ ] GitHub release created
- [ ] Verified installation works

## Next Actions After Publishing

1. **Announce** - Share on relevant channels
2. **Monitor** - Watch for issues/questions
3. **Document** - Add usage examples, tutorials
4. **Iterate** - Collect feedback, plan next release

---

**Need help?** Check RELEASE.md for detailed release procedures.

**Ready?** Run the commands in Step 1! 🎉
