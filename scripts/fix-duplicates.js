#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🔧 Auto-fix for duplicate imports...\n');

function mergeDuplicateImports(content) {
  const lines = content.split('\n');
  const importMap = new Map();
  const linesToRemove = new Set();
  let modified = false;

  lines.forEach((line, idx) => {
    const match = line.match(/^import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?\s*$/);
    
    if (match) {
      const imports = match[1].split(',').map(s => s.trim()).filter(Boolean);
      const moduleName = match[2];
      
      if (importMap.has(moduleName)) {
        const existing = importMap.get(moduleName);
        existing.imports.push(...imports);
        linesToRemove.add(idx);
        modified = true;
      } else {
        importMap.set(moduleName, {
          line: idx,
          imports: imports,
          originalLine: line,
        });
      }
    }
  });

  if (!modified) {
    return content;
  }

  const newLines = [];
  
  lines.forEach((line, idx) => {
    if (linesToRemove.has(idx)) {
      return;
    }
    
    const moduleEntry = Array.from(importMap.entries()).find(([_, data]) => data.line === idx);
    
    if (moduleEntry) {
      const [moduleName, data] = moduleEntry;
      const uniqueImports = [...new Set(data.imports)].sort();
      newLines.push(`import { ${uniqueImports.join(', ')} } from '${moduleName}';`);
    } else {
      newLines.push(line);
    }
  });

  return newLines.join('\n');
}

function fixDuplicatesInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = mergeDuplicateImports(content);
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  
  return false;
}

const tsFiles = globSync('src/**/*.{ts,tsx,js,jsx}', {
  cwd: projectRoot,
  absolute: true,
  nodir: true,
  ignore: ['**/node_modules/**', '**/.git/**'],
});

let fixedCount = 0;

tsFiles.forEach((file) => {
  const relativePath = path.relative(projectRoot, file);
  
  if (fixDuplicatesInFile(file)) {
    console.log(`✅ Fixed: ${relativePath}`);
    fixedCount++;
  }
});

if (fixedCount > 0) {
  console.log(`\n✨ Fixed duplicate imports in ${fixedCount} file(s)\n`);
} else {
  console.log('\n✅ No duplicate imports to fix\n');
}
