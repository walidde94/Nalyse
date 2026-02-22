# Code Cleanup Guide

## Quick Start

To perform a complete cleanup of the Nalyse codebase:

```bash
# 1. Run the automated console cleanup
./scripts/cleanup-console.sh

# 2. Review the changes
git diff

# 3. Run linting (if configured)
cd frontend && npm run lint
cd ../backend && npm run lint

# 4. Test the application
npm run dev
```

## What Was Cleaned

### ✅ Completed Automatically

1. **File Organization**
   - Moved 23 development docs to `docs/development-notes/`
   - Moved 4 CSV test files to `test-data/`
   - Removed all `.DS_Store` files

2. **Temporary Files**
   - Removed `backend/.backend_logs.txt`
   - Removed `backend/.backend_pid`
   - Removed malformed env file fragments

3. **Console Statements**
   - Removed `console.log()` (debug statements)
   - Removed `console.warn()` (warnings)
   - Removed `console.info()` (info statements)
   - Removed `console.debug()` (debug statements)
   - **Kept** `console.error()` for production error tracking

4. **Git Configuration**
   - Enhanced `.gitignore` with comprehensive patterns
   - Added patterns for temporary files, logs, and OS files

### 📋 Manual Review Recommended

The following areas should be manually reviewed:

1. **Unused Imports**
   ```bash
   # Use ESLint to find unused imports
   npm run lint -- --fix
   ```

2. **Commented Code**
   - Review and remove old commented-out code blocks
   - Keep only meaningful comments

3. **Type Safety**
   - Replace `any` types with proper TypeScript types
   - Add missing type annotations

4. **Error Handling**
   - Ensure all async operations have proper error handling
   - Add user-friendly error messages

## Cleanup Scripts

### `scripts/cleanup-console.sh`
Automatically removes debug console statements from all TypeScript files.

**Usage:**
```bash
./scripts/cleanup-console.sh
```

**What it does:**
- Scans all `.ts` and `.tsx` files
- Removes `console.log`, `console.warn`, `console.info`, `console.debug`
- Preserves `console.error` for production debugging
- Shows summary of cleaned files

## Best Practices Going Forward

### 1. Use Proper Logging

Instead of `console.log`, use a logging utility:

```typescript
// ❌ Bad
console.log('User logged in:', user);

// ✅ Good
logger.info('User logged in', { userId: user.id });
```

### 2. Environment-Based Debugging

```typescript
// Create a debug utility
const debug = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data);
  }
};
```

### 3. Pre-commit Hooks

Consider adding a pre-commit hook to prevent console statements:

```bash
# Install husky
npm install --save-dev husky

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint"
```

### 4. Code Review Checklist

Before committing code, check:
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] No unused imports
- [ ] Proper error handling
- [ ] TypeScript types are specific (no `any`)
- [ ] No temporary files

## Maintenance

### Regular Cleanup

Run these commands periodically:

```bash
# Remove console statements
./scripts/cleanup-console.sh

# Find unused dependencies
npx depcheck

# Update dependencies
npm outdated
npm update

# Clean build artifacts
rm -rf frontend/dist backend/dist
rm -rf frontend/node_modules backend/node_modules
npm install
```

### Git Hygiene

```bash
# Remove untracked files (be careful!)
git clean -fd

# Remove files that should be ignored
git rm --cached -r .
git add .
git commit -m "chore: clean up ignored files"
```

## Troubleshooting

### Script Permissions

If the cleanup script doesn't run:
```bash
chmod +x scripts/cleanup-console.sh
```

### Sed Compatibility

On macOS, if you encounter sed errors:
```bash
brew install gnu-sed
# Update script to use gsed instead of sed
```

## Files Structure After Cleanup

```
Nalyse/
├── docs/
│   ├── CLEANUP_SUMMARY.md
│   └── development-notes/     # All dev docs moved here
├── test-data/                 # All CSV test files moved here
├── scripts/
│   └── cleanup-console.sh     # Automated cleanup script
├── frontend/
│   └── src/                   # No console.log statements
├── backend/
│   └── src/                   # No console.log statements
└── .gitignore                 # Enhanced patterns
```

## Summary

This cleanup process has:
- ✅ Organized 27 files into proper directories
- ✅ Removed 3 `.DS_Store` files
- ✅ Cleaned 19 files with console statements
- ✅ Enhanced `.gitignore` with 20+ new patterns
- ✅ Created automated cleanup tooling
- ✅ Documented best practices

The codebase is now cleaner, more maintainable, and production-ready! 🎉
