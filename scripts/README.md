# Pre-Build Scanner

## Overview

Comprehensive diagnostic tool that scans the codebase for compilation errors, syntax issues, and code quality problems before building.

## Quick Start

```bash
# Run full diagnostic scan
npm run scan

# Auto-fix duplicate imports + scan
npm run scan:fix

# Scan before building (recommended)
npm run safe-build
```

## What It Checks

### TypeScript/JavaScript
- ✅ Incomplete import statements
- ✅ Syntax errors (via TypeScript compiler API)
- ✅ Duplicate interfaces, types, classes, functions
- ✅ Import/export path validation
- ✅ React-specific issues (hooks, keys, components)

### Configuration Files
- ✅ package.json, tsconfig.json validation
- ✅ Tauri v2 configuration checks
- ✅ Vite and Tailwind config syntax
- ✅ .env file validation

### Rust (Tauri Backend)
- ✅ Duplicate mod/use declarations
- ✅ Cargo.toml structure validation

### Code Quality
- ✅ Merge conflict markers
- ✅ Circular dependencies
- ✅ Broken symlinks
- ✅ Large files (>50MB)
- ✅ Invalid filenames

## Output

**Terminal**: Color-coded errors and warnings with file locations and fixes

**JSON Report**: Machine-readable `diagnostic-report.json` with full details

## Exit Codes

- `0` - No errors (warnings may exist)
- `1` - Errors found (build will fail)
- `2` - Fatal scanner error

## CI/CD Integration

### GitHub Actions
```yaml
- run: npm install
- run: npm run scan
- name: Upload Report
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: diagnostic-report
    path: diagnostic-report.json
```

### Pre-commit Hook
```bash
#!/bin/bash
npm run scan || exit 1
```

## Common Error Types

| Type | Fix |
|------|-----|
| `INCOMPLETE_IMPORT` | Complete the import statement |
| `TS_SYNTAX_ERROR` | Fix TypeScript syntax |
| `DUPLICATE_DEFINITION` | Merge or rename duplicates |
| `IMPORT_FILE_NOT_FOUND` | Fix import path or create file |
| `MERGE_CONFLICT` | Resolve merge conflicts |
| `INVALID_TAURI_CONFIG` | Update for Tauri v2 |

## Files

- `pre-build-scanner.js` - Main scanner with all checks
- `fix-duplicates.js` - Auto-fix duplicate imports
- `diagnostic-report.json` - Generated scan results (gitignored)

## Performance

Scans entire codebase in ~1-2 seconds. Ignores: node_modules, .git, dist, build, target
