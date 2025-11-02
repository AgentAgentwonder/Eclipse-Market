#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];
const dependencyGraph = new Map();

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const IGNORE_GLOBS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.idea/**',
  '**/.vscode/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.cache/**',
  '**/tmp/**',
  '**/logs/**',
  'src-tauri/target/**',
];

const RELATIVE_IMPORT_IGNORE = ['@', '~', '#'];

function logStep(message) {
  console.log(`${COLORS.cyan}${message}${COLORS.reset}`);
}

function rel(filePath) {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

function addError(type, payload) {
  errors.push({ type, ...payload });
}

function addWarning(type, payload) {
  warnings.push({ type, ...payload });
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    addError('FILE_READ_ERROR', {
      file: rel(filePath),
      error: error.message,
      fix: 'Verify file exists and has readable permissions',
    });
    return null;
  }
}

function getScriptKind(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.ts':
      return ts.ScriptKind.TS;
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.mjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.JS;
  }
}

function formatDiagnosticMessage(message) {
  return ts.flattenDiagnosticMessageText(message, '\n');
}

function resolveImportSpecifier(importer, specifier) {
  const [baseSpecifier] = specifier.split('?');
  const normalized = baseSpecifier.replace(/\\/g, '/');

  if (!normalized.startsWith('.')) {
    return null;
  }

  const importerDir = path.dirname(importer);
  const resolvedBase = path.resolve(importerDir, normalized);
  const candidateFiles = [
    resolvedBase,
    `${resolvedBase}.ts`,
    `${resolvedBase}.tsx`,
    `${resolvedBase}.js`,
    `${resolvedBase}.jsx`,
    `${resolvedBase}.mjs`,
    `${resolvedBase}.cjs`,
    `${resolvedBase}.json`,
    `${resolvedBase}.css`,
    `${resolvedBase}.scss`,
    `${resolvedBase}.sass`,
    `${resolvedBase}.less`,
  ];

  for (const candidate of candidateFiles) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const candidateDirectories = [
    path.join(resolvedBase, 'index.ts'),
    path.join(resolvedBase, 'index.tsx'),
    path.join(resolvedBase, 'index.js'),
    path.join(resolvedBase, 'index.jsx'),
    path.join(resolvedBase, 'index.mjs'),
    path.join(resolvedBase, 'index.cjs'),
  ];

  for (const candidate of candidateDirectories) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  return null;
}

function analyzeSourceFile(filePath) {
  const content = readFileSafe(filePath);
  if (content == null) return;

  const relativePath = rel(filePath);
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (/import\s+.*\s+from\s*\.\.\.?/.test(trimmed) || /import\s+.*\s+from\s*$/.test(trimmed)) {
      addError('INCOMPLETE_IMPORT', {
        file: relativePath,
        line: index + 1,
        content: trimmed,
        fix: 'Complete the import statement with a valid module specifier',
      });
    }

    if (/^import\s+{[^}]+}\s*$/.test(trimmed) && !/from\s+['"`]/.test(trimmed)) {
      addError('INCOMPLETE_IMPORT', {
        file: relativePath,
        line: index + 1,
        content: trimmed,
        fix: 'Add "from \"module\"" to the import statement',
      });
    }

    if (/^<<<<<<< |^=======\s*$|^>>>>>>> /.test(trimmed)) {
      addError('MERGE_CONFLICT', {
        file: relativePath,
        line: index + 1,
        content: trimmed,
        fix: 'Resolve merge conflict markers before building',
      });
    }
  });

  const scriptKind = getScriptKind(filePath);
  const sourceFile = ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true, scriptKind);

  if (sourceFile.parseDiagnostics?.length) {
    for (const diagnostic of sourceFile.parseDiagnostics) {
      const { line, character } = diagnostic.file
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0)
        : { line: 0, character: 0 };

      addError('TS_SYNTAX_ERROR', {
        file: relativePath,
        line: line + 1,
        column: character + 1,
        message: formatDiagnosticMessage(diagnostic.messageText),
        fix: 'Fix TypeScript/JavaScript syntax error',
      });
    }
  }

  const declarationMap = new Map();
  const importCount = new Map();
  const currentDependencies = dependencyGraph.get(relativePath) ?? new Set();

  function recordDuplicate(kind, name, node) {
    if (!name) return;
    const key = `${kind}:${name}`;
    const start = node.getStart(sourceFile);
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(start);
    const occurrence = { line: line + 1, column: character + 1 };

    if (!declarationMap.has(key)) {
      declarationMap.set(key, { kind, name, occurrences: [occurrence] });
    } else {
      declarationMap.get(key).occurrences.push(occurrence);
    }
  }

  for (const statement of sourceFile.statements) {
    if (ts.isInterfaceDeclaration(statement)) {
      recordDuplicate('interface', statement.name?.text, statement.name);
    }

    if (ts.isTypeAliasDeclaration(statement)) {
      recordDuplicate('type', statement.name?.text, statement.name);
    }

    if (ts.isClassDeclaration(statement) && statement.name) {
      recordDuplicate('class', statement.name.text, statement.name);
    }

    if (ts.isEnumDeclaration(statement)) {
      recordDuplicate('enum', statement.name?.text, statement.name);
    }

    if (ts.isFunctionDeclaration(statement) && statement.name) {
      recordDuplicate('function', statement.name.text, statement.name);
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          recordDuplicate('variable', declaration.name.text, declaration.name);
        }
      }
    }

    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleText = statement.moduleSpecifier.text;
      const start = statement.moduleSpecifier.getStart(sourceFile);
      const { line } = sourceFile.getLineAndCharacterOfPosition(start);

      importCount.set(moduleText, (importCount.get(moduleText) ?? 0) + 1);

      const isRelative = moduleText.startsWith('.') || RELATIVE_IMPORT_IGNORE.includes(moduleText[0]);

      if (moduleText.startsWith('.') || moduleText.startsWith('/')) {
        const resolved = resolveImportSpecifier(filePath, moduleText);
        if (!resolved) {
          addError('IMPORT_FILE_NOT_FOUND', {
            file: relativePath,
            line: line + 1,
            importPath: moduleText,
            fix: 'Ensure the imported file exists or adjust the relative path',
          });
        } else {
          const targetRelative = rel(resolved);
          currentDependencies.add(targetRelative.replace(/\.(ts|tsx|js|jsx|mjs|cjs|json)$/i, ''));
        }
      } else if (!isRelative && moduleText.includes('/')) {
        // Non-relative path with slash could indicate missing alias configuration
        if (!moduleText.startsWith('@')) {
          currentDependencies.add(moduleText);
        }
      }
    }

    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleText = statement.moduleSpecifier.text;
      if (moduleText.startsWith('.')) {
        const resolved = resolveImportSpecifier(filePath, moduleText);
        if (!resolved) {
          const start = statement.moduleSpecifier.getStart(sourceFile);
          const { line } = sourceFile.getLineAndCharacterOfPosition(start);
          addError('EXPORT_TARGET_NOT_FOUND', {
            file: relativePath,
            line: line + 1,
            exportPath: moduleText,
            fix: 'Ensure exported file exists or adjust the path',
          });
        }
      }
    }
  }

  dependencyGraph.set(relativePath, currentDependencies);

  for (const entry of declarationMap.values()) {
    if (entry.occurrences.length > 1) {
      addError('DUPLICATE_DEFINITION', {
        file: relativePath,
        kind: entry.kind,
        name: entry.name,
        occurrences: entry.occurrences,
        fix: `Merge or remove duplicate ${entry.kind} '${entry.name}' definitions in this file`,
      });
    }
  }

  for (const [moduleName, count] of importCount.entries()) {
    if (count > 1) {
      addWarning('DUPLICATE_IMPORT', {
        file: relativePath,
        module: moduleName,
        count,
        fix: `Combine imports from '${moduleName}' into a single statement`,
      });
    }
  }

  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    const conditionalHookPattern = /if\s*\([^)]*\)\s*{[^}]*use(?:State|Effect|Memo|Callback|Reducer|Context|Ref)\s*\(/gs;
    if (conditionalHookPattern.test(content)) {
      addWarning('CONDITIONAL_HOOK_USAGE', {
        file: relativePath,
        fix: 'React hooks must not be called inside conditional statements',
      });
    }

    const mapWithoutKeyPattern = /\.map\s*\([^\)]*=>\s*<([A-Z][\w]*)[^>]*>/g;
    let mapMatch;
    while ((mapMatch = mapWithoutKeyPattern.exec(content)) !== null) {
      const snippet = content.slice(mapMatch.index, mapMatch.index + 120);
      if (!/key\s*=/.test(snippet)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(mapMatch.index);
        addWarning('MISSING_REACT_KEY', {
          file: relativePath,
          line: line + 1,
          component: mapMatch[1],
          fix: 'Provide a stable key prop when rendering lists',
        });
      }
    }
  }
}

function scanTypeScriptFiles() {
  logStep('📝 Scanning TypeScript/JavaScript files...');
  const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
    cwd: projectRoot,
    absolute: true,
    nodir: true,
    ignore: IGNORE_GLOBS,
  });

  files.forEach(analyzeSourceFile);
}

function scanMergeConflicts() {
  logStep('🔍 Checking for merge conflict markers...');
  const files = globSync('**/*', {
    cwd: projectRoot,
    absolute: true,
    nodir: true,
    ignore: IGNORE_GLOBS,
  });

  for (const file of files) {
    const stats = fs.statSync(file);
    if (stats.size === 0 || stats.size > 5 * 1024 * 1024) {
      continue;
    }

    const content = readFileSafe(file);
    if (content == null) continue;

    const lines = content.split(/\r?\n/);
    const conflictLines = [];

    lines.forEach((line, index) => {
      if (/^<<<<<<< |^=======\s*$|^>>>>>>> /.test(line.trim())) {
        conflictLines.push(index + 1);
      }
    });

    if (conflictLines.length > 0) {
      addError('MERGE_CONFLICT_MARKERS', {
        file: rel(file),
        count: conflictLines.length,
        lines: conflictLines,
        fix: 'Resolve merge conflicts before building',
      });
    }
  }
}

function validateJsonFile(relativePath, { errorType = 'INVALID_JSON', onValid } = {}) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return;

  const content = readFileSafe(absolutePath);
  if (content == null) return;

  try {
    const json = JSON.parse(content);
    if (onValid) {
      onValid(json, absolutePath);
    }
  } catch (error) {
    addError(errorType, {
      file: relativePath,
      error: error.message,
      fix: `Fix JSON syntax in ${relativePath}`,
    });
  }
}

function validateConfigFiles() {
  logStep('⚙️  Validating configuration files...');

  validateJsonFile('package.json', {
    onValid(json) {
      if (!json.dependencies && !json.devDependencies) {
        addWarning('NO_DEPENDENCIES_DEFINED', {
          file: 'package.json',
          fix: 'Add required dependencies to package.json',
        });
      }

      const nodeModulesPath = path.join(projectRoot, 'node_modules');
      if (!fs.existsSync(nodeModulesPath)) {
        addWarning('MISSING_NODE_MODULES', {
          fix: 'Run `npm install` to install dependencies',
        });
      }

      const lockFilePath = path.join(projectRoot, 'package-lock.json');
      if (!fs.existsSync(lockFilePath)) {
        addWarning('MISSING_PACKAGE_LOCK', {
          fix: 'Commit a lockfile (package-lock.json) to ensure reproducible installs',
        });
      }
    },
  });

  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const configText = readFileSafe(tsconfigPath);
    if (configText) {
      const result = ts.parseConfigFileTextToJson('tsconfig.json', configText);
      if (result.error) {
        addError('INVALID_TSCONFIG', {
          file: 'tsconfig.json',
          message: formatDiagnosticMessage(result.error.messageText),
          fix: 'Resolve tsconfig.json parse errors',
        });
      } else if (!result.config.compilerOptions) {
        addWarning('MISSING_TSCONFIG_OPTIONS', {
          file: 'tsconfig.json',
          fix: 'Define compilerOptions to control TypeScript behavior',
        });
      }
    }
  }

  validateJsonFile('src-tauri/tauri.conf.json', {
    onValid(json) {
      if (json.build && (json.build.devPath || json.build.distDir)) {
        addError('INVALID_TAURI_CONFIG', {
          file: 'src-tauri/tauri.conf.json',
          issue: 'devPath/distDir should not be defined under build for Tauri v2',
          fix: 'Move devPath/distDir into tauri.build before building',
        });
      }
    },
  });

  const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
  if (fs.existsSync(tailwindConfigPath)) {
    const content = readFileSafe(tailwindConfigPath);
    if (content) {
      const sourceFile = ts.createSourceFile('tailwind.config.js', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      if (sourceFile.parseDiagnostics.length > 0) {
        addError('TAILWIND_CONFIG_SYNTAX', {
          file: 'tailwind.config.js',
          message: formatDiagnosticMessage(sourceFile.parseDiagnostics[0].messageText),
          fix: 'Resolve Tailwind configuration syntax errors',
        });
      } else if (!/content\s*:\s*\[/.test(content) && !/purge\s*:\s*\[/.test(content)) {
        addWarning('TAILWIND_NO_CONTENT', {
          file: 'tailwind.config.js',
          fix: 'Specify the content array for Tailwind to purge unused styles',
        });
      }
    }
  }

  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const content = readFileSafe(viteConfigPath);
    if (content) {
      const sourceFile = ts.createSourceFile('vite.config.ts', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      if (sourceFile.parseDiagnostics.length > 0) {
        addError('VITE_CONFIG_SYNTAX', {
          file: 'vite.config.ts',
          message: formatDiagnosticMessage(sourceFile.parseDiagnostics[0].messageText),
          fix: 'Fix syntax issues in vite.config.ts',
        });
      }
    }
  }

  const envFiles = globSync('.env*', {
    cwd: projectRoot,
    absolute: true,
    nodir: true,
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  envFiles.forEach((file) => {
    const content = readFileSafe(file);
    if (!content) return;

    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!line || line.trim().startsWith('#')) return;
      if (!/^([A-Z0-9_]+)=(.*)$/.test(line)) {
        addWarning('ENV_SYNTAX_WARNING', {
          file: rel(file),
          line: index + 1,
          content: line.trim(),
          fix: 'Ensure environment variables follow KEY=VALUE format',
        });
      }
    });
  });
}

function scanRustFiles() {
  logStep('🦀 Scanning Rust sources...');
  const rustFiles = globSync('src-tauri/src/**/*.rs', {
    cwd: projectRoot,
    absolute: true,
    nodir: true,
  });

  rustFiles.forEach((file) => {
    const content = readFileSafe(file);
    if (!content) return;

    const relativePath = rel(file);

    if (file.endsWith('lib.rs')) {
      const modMatches = [...content.matchAll(/^mod\s+(\w+);/gm)];
      const modMap = new Map();
      modMatches.forEach((match) => {
        const name = match[1];
        modMap.set(name, (modMap.get(name) ?? 0) + 1);
      });

      for (const [name, count] of modMap.entries()) {
        if (count > 1) {
          addError('DUPLICATE_RUST_MOD', {
            file: relativePath,
            module: name,
            count,
            fix: `Remove duplicate "mod ${name};" declaration`,
          });
        }
      }

      const pubUseMatches = [...content.matchAll(/^pub\s+use\s+([^;]+);/gm)];
      const useMap = new Map();
      pubUseMatches.forEach((match) => {
        const pathSegment = match[1].trim();
        useMap.set(pathSegment, (useMap.get(pathSegment) ?? 0) + 1);
      });

      for (const [segment, count] of useMap.entries()) {
        if (count > 1) {
          addWarning('DUPLICATE_RUST_USE', {
            file: relativePath,
            usePath: segment,
            count,
            fix: `Consolidate duplicate "pub use ${segment};" statements`,
          });
        }
      }
    }

    const unmatchedBracePattern = /\{(?![^\}]*\})/g;
    const unmatched = content.match(unmatchedBracePattern);
    if (unmatched && unmatched.length > 0) {
      addWarning('RUST_UNMATCHED_BRACES', {
        file: relativePath,
        count: unmatched.length,
        fix: 'Verify Rust source has balanced braces',
      });
    }
  });

  const cargoPath = path.join(projectRoot, 'src-tauri/Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    const content = readFileSafe(cargoPath);
    if (content) {
      if (!/^\s*\[package\]/m.test(content)) {
        addError('CARGO_MISSING_PACKAGE', {
          file: 'src-tauri/Cargo.toml',
          fix: 'Add [package] section to Cargo.toml',
        });
      }

      const duplicateSections = [...content.matchAll(/^\s*\[(\w+)\]/gm)];
      const sectionCounts = new Map();
      duplicateSections.forEach((match) => {
        sectionCounts.set(match[1], (sectionCounts.get(match[1]) ?? 0) + 1);
      });

      for (const [section, count] of sectionCounts.entries()) {
        if (count > 1 && section !== 'dependencies') {
          addWarning('CARGO_DUPLICATE_SECTION', {
            file: 'src-tauri/Cargo.toml',
            section,
            count,
            fix: `Ensure [${section}] section is not duplicated`,
          });
        }
      }
    }
  }
}

function detectCircularDependencies() {
  logStep('🔄 Detecting circular dependencies...');

  const visited = new Set();
  const stack = new Set();
  const cycles = new Set();

  function visit(node, pathStack) {
    if (stack.has(node)) {
      const cycleStartIndex = pathStack.indexOf(node);
      if (cycleStartIndex >= 0) {
        const cyclePath = pathStack.slice(cycleStartIndex).concat(node);
        const cycleKey = cyclePath.join(' -> ');
        if (!cycles.has(cycleKey)) {
          cycles.add(cycleKey);
          addWarning('CIRCULAR_DEPENDENCY', {
            cycle: cyclePath.join(' -> '),
            fix: 'Refactor modules to break the circular dependency',
          });
        }
      }
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    stack.add(node);

    const neighbours = dependencyGraph.get(node) ?? new Set();
    for (const neighbour of neighbours) {
      visit(neighbour, [...pathStack, neighbour]);
    }

    stack.delete(node);
  }

  for (const node of dependencyGraph.keys()) {
    visit(node, [node]);
  }
}

function checkFileSystemIssues() {
  logStep('📁 Checking file system issues...');

  const files = globSync('**/*', {
    cwd: projectRoot,
    absolute: true,
    nodir: true,
    ignore: IGNORE_GLOBS,
  });

  files.forEach((file) => {
    const stats = fs.lstatSync(file);

    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(file);
      const resolved = path.isAbsolute(target) ? target : path.resolve(path.dirname(file), target);
      if (!fs.existsSync(resolved)) {
        addWarning('BROKEN_SYMLINK', {
          file: rel(file),
          target,
          fix: 'Update or remove the broken symbolic link',
        });
      }
      return;
    }

    if (stats.size > 50 * 1024 * 1024) {
      addWarning('LARGE_FILE', {
        file: rel(file),
        size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        fix: 'Consider storing large assets externally or ensuring they are required',
      });
    }

    if (/[<>:"|?*]/.test(path.basename(file))) {
      addWarning('INVALID_FILENAME', {
        file: rel(file),
        fix: 'Rename file to remove characters incompatible with cross-platform builds',
      });
    }
  });
}

function generateReport(durationMs) {
  console.log('\n' + '='.repeat(50));
  console.log(`${COLORS.cyan}          DIAGNOSTIC REPORT${COLORS.reset}`);
  console.log('='.repeat(50) + '\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${COLORS.green}✅ No issues found! Code should compile successfully.${COLORS.reset}\n`);
  } else {
    if (errors.length > 0) {
      console.log(`${COLORS.red}🔴 ERRORS (${errors.length}) - Will prevent compilation:${COLORS.reset}\n`);
      errors.forEach((err, idx) => {
        console.log(`${COLORS.red}${idx + 1}. [${err.type}]${COLORS.reset}`);
        if (err.file) console.log(`   ${COLORS.blue}File:${COLORS.reset} ${err.file}`);
        if (err.line) console.log(`   ${COLORS.blue}Line:${COLORS.reset} ${err.line}`);
        if (err.column) console.log(`   ${COLORS.blue}Column:${COLORS.reset} ${err.column}`);
        if (err.message) console.log(`   ${COLORS.blue}Message:${COLORS.reset} ${err.message}`);
        if (err.content) console.log(`   ${COLORS.blue}Content:${COLORS.reset} ${err.content}`);
        if (err.importPath) console.log(`   ${COLORS.blue}Import:${COLORS.reset} ${err.importPath}`);
        if (err.exportPath) console.log(`   ${COLORS.blue}Export:${COLORS.reset} ${err.exportPath}`);
        if (err.occurrences) {
          const details = err.occurrences
            .map((occ, i) => `      ${i + 1}. line ${occ.line}, column ${occ.column}`)
            .join('\n');
          console.log(`   ${COLORS.blue}Occurrences:${COLORS.reset}\n${details}`);
        }
        if (err.issue) console.log(`   ${COLORS.blue}Issue:${COLORS.reset} ${err.issue}`);
        if (err.error) console.log(`   ${COLORS.blue}Error:${COLORS.reset} ${err.error}`);
        console.log(`   ${COLORS.green}Fix:${COLORS.reset} ${err.fix}\n`);
      });
    }

    if (warnings.length > 0) {
      console.log(`${COLORS.yellow}⚠️  WARNINGS (${warnings.length}) - May cause issues:${COLORS.reset}\n`);
      warnings.forEach((warn, idx) => {
        console.log(`${COLORS.yellow}${idx + 1}. [${warn.type}]${COLORS.reset}`);
        if (warn.file) console.log(`   ${COLORS.blue}File:${COLORS.reset} ${warn.file}`);
        if (warn.line) console.log(`   ${COLORS.blue}Line:${COLORS.reset} ${warn.line}`);
        if (warn.module) console.log(`   ${COLORS.blue}Module:${COLORS.reset} ${warn.module} (${warn.count ?? 1}x)`);
        if (warn.count && !warn.module) console.log(`   ${COLORS.blue}Count:${COLORS.reset} ${warn.count}`);
        if (warn.component) console.log(`   ${COLORS.blue}Component:${COLORS.reset} ${warn.component}`);
        if (warn.size) console.log(`   ${COLORS.blue}Size:${COLORS.reset} ${warn.size}`);
        if (warn.cycle) console.log(`   ${COLORS.blue}Cycle:${COLORS.reset} ${warn.cycle}`);
        if (warn.target) console.log(`   ${COLORS.blue}Target:${COLORS.reset} ${warn.target}`);
        if (warn.issue) console.log(`   ${COLORS.blue}Issue:${COLORS.reset} ${warn.issue}`);
        if (warn.content) console.log(`   ${COLORS.blue}Content:${COLORS.reset} ${warn.content}`);
        console.log(`   ${COLORS.green}Fix:${COLORS.reset} ${warn.fix}\n`);
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    durationMs,
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      totalIssues: errors.length + warnings.length,
    },
    errors,
    warnings,
  };

  const reportPath = path.join(projectRoot, 'diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${COLORS.cyan}📄 Full report saved to: diagnostic-report.json${COLORS.reset}\n`);
  console.log(`${COLORS.cyan}⏱️  Scan completed in ${(durationMs / 1000).toFixed(2)}s${COLORS.reset}\n`);
}

function main() {
  try {
    console.log(`${COLORS.cyan}\n🔍 Starting pre-build diagnostic scan...${COLORS.reset}\n`);
    const start = Date.now();

    scanTypeScriptFiles();
    scanMergeConflicts();
    validateConfigFiles();
    scanRustFiles();
    detectCircularDependencies();
    checkFileSystemIssues();

    const duration = Date.now() - start;
    generateReport(duration);

    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error) {
    console.error(`${COLORS.red}Fatal error during scan: ${error.message}${COLORS.reset}`);
    console.error(error.stack);
    process.exit(2);
  }
}

main();

export { main };
