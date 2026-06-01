# Git Hooks Configuration

This document describes the Git hooks setup for the MedCore BD project using Husky and lint-staged.

## Overview

The project uses **Husky** to manage Git hooks and **lint-staged** to run ESLint only on staged files. This ensures code quality by preventing commits with linting errors.

## Setup Location

- **Git Repository Root**: `C:\Projects\Health Care\`
- **Husky Configuration**: `.husky/` directory at repository root
- **Lint-staged Configuration**: `.lintstagedrc.js` at repository root
- **Frontend Code**: `health-care/` subdirectory
- **Backend Code**: `health-care/backend/` subdirectory

## Installed Packages

### Root Level (`package.json`)
```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^17.0.7"
  }
}
```

### Frontend (`health-care/package.json`)
```json
{
  "devDependencies": {
    "lint-staged": "^17.0.7"
  }
}
```

### Backend (`health-care/backend/package.json`)
```json
{
  "devDependencies": {
    "lint-staged": "^17.0.7"
  }
}
```

## Pre-commit Hook

**Location**: `.husky/pre-commit`

**Purpose**: Runs ESLint on all staged JavaScript/TypeScript files before allowing a commit.

**Behavior**:
- Automatically runs when you execute `git commit`
- Lints only staged files (not the entire codebase)
- Auto-fixes issues where possible
- **Blocks the commit** if any linting errors or warnings remain
- Configured with `--max-warnings 0` to enforce zero warnings

## Lint-staged Configuration

**Location**: `.lintstagedrc.js`

```javascript
module.exports = {
  // Frontend files (Next.js)
  'health-care/src/**/*.{js,jsx,ts,tsx}': [
    'cd health-care && npm run lint:fix',
  ],
  
  // Backend files
  'health-care/backend/src/**/*.{js,jsx,ts,tsx}': [
    'cd health-care/backend && npm run lint:fix',
  ],
};
```

**How it works**:
1. Detects which files are staged for commit
2. Matches them against the glob patterns
3. Runs the appropriate lint command for each workspace
4. Auto-fixes issues where possible
5. Fails if any errors/warnings remain after auto-fix

## ESLint Commands

### Frontend
```bash
cd health-care
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
```

### Backend
```bash
cd health-care/backend
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
```

## Testing the Hook

### Test 1: Commit with Linting Errors (Should Fail)

1. Create a file with intentional linting errors:
```javascript
// health-care/src/utils/test.js
import React from 'react'

export default function Test() {
  const [count, setCount] = React.useState(0)
  
  // Missing dependency in useEffect - will trigger warning
  React.useEffect(() => {
    console.log(count)
  }, [])
  
  return <div>{count}</div>
}
```

2. Stage and commit:
```bash
git add health-care/src/utils/test.js
git commit -m "test: verify pre-commit hook"
```

3. **Expected Result**: Commit is blocked with error message showing the linting issue.

### Test 2: Commit with Clean Code (Should Succeed)

1. Fix the linting errors:
```javascript
// health-care/src/utils/test.js
import React from 'react'

export default function Test() {
  const [count, setCount] = React.useState(0)
  
  // Fixed: added count to dependency array
  React.useEffect(() => {
    console.log(count)
  }, [count])
  
  return <div>{count}</div>
}
```

2. Stage and commit:
```bash
git add health-care/src/utils/test.js
git commit -m "test: verify pre-commit hook with clean code"
```

3. **Expected Result**: Commit succeeds.

## Bypassing the Hook (Not Recommended)

In rare cases where you need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "your message"
```

**⚠️ Warning**: Only use this in emergencies. Bypassing the hook defeats the purpose of code quality enforcement.

## Troubleshooting

### Hook Not Running

**Problem**: Pre-commit hook doesn't run when committing.

**Solution**:
1. Verify Husky is installed at the root:
   ```bash
   cd "C:\Projects\Health Care"
   npm install
   ```

2. Check that `.husky/pre-commit` exists and is executable

3. Verify you're committing from within the git repository

### Lint-staged Not Finding Files

**Problem**: `lint-staged could not find any staged files matching configured tasks`

**Solution**:
1. Verify the file paths in `.lintstagedrc.js` match your staged files
2. Check that you're staging files in the correct directories:
   - Frontend: `health-care/src/**/*.{js,jsx,ts,tsx}`
   - Backend: `health-care/backend/src/**/*.{js,jsx,ts,tsx}`

### ESLint Command Fails

**Problem**: ESLint command fails with "command not found" or similar error.

**Solution**:
1. Ensure ESLint is installed in the respective workspace:
   ```bash
   cd health-care && npm install
   cd health-care/backend && npm install
   ```

2. Verify the lint scripts exist in `package.json`:
   - Frontend: `"lint:fix": "next lint --fix"`
   - Backend: `"lint:fix": "eslint src --fix"`

## Benefits

✅ **Consistent Code Quality**: All committed code meets linting standards
✅ **Fast Feedback**: Catch issues before they reach CI/CD
✅ **Automatic Fixes**: Many issues are auto-fixed without manual intervention
✅ **Selective Linting**: Only lints changed files, not the entire codebase
✅ **Team Alignment**: Everyone follows the same code standards

## Related Files

- `.husky/pre-commit` - Pre-commit hook script
- `.lintstagedrc.js` - Lint-staged configuration
- `health-care/eslint.config.mjs` - Frontend ESLint configuration
- `health-care/backend/.eslintrc.js` - Backend ESLint configuration
- `package.json` (root) - Husky and lint-staged dependencies
- `health-care/package.json` - Frontend lint scripts
- `health-care/backend/package.json` - Backend lint scripts

## Maintenance

### Updating Husky

```bash
cd "C:\Projects\Health Care"
npm update husky
```

### Updating lint-staged

```bash
cd "C:\Projects\Health Care"
npm update lint-staged
```

### Adding New File Patterns

Edit `.lintstagedrc.js` to add new file patterns:

```javascript
module.exports = {
  // Existing patterns...
  
  // Add new pattern
  'health-care/scripts/**/*.js': [
    'cd health-care && eslint --fix',
  ],
};
```

## Commit Message Linting

The project also uses **commitlint** to enforce conventional commit messages. This is configured in `health-care/commitlint.config.js` and runs via the `.husky/commit-msg` hook (if configured).

**Conventional Commit Format**:
```
<type>(<scope>): <subject>

Examples:
feat(auth): add JWT refresh token support
fix(cart): resolve quantity update bug
docs(readme): update installation instructions
```

## Summary

The Git hooks setup ensures that:
1. All committed code passes ESLint checks
2. Code quality is maintained across both frontend and backend
3. Issues are caught early in the development process
4. The codebase remains clean and maintainable

For questions or issues, refer to the [Husky documentation](https://typicode.github.io/husky/) or [lint-staged documentation](https://github.com/lint-staged/lint-staged).
