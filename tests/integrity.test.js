import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = path.resolve(__dirname, '../extension');

function getJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

const jsFiles = getJsFiles(EXTENSION_DIR);

describe('Codebase Integrity', () => {
  it('should have no syntax errors in any JS file', async () => {
    for (const file of jsFiles) {
      try {
        await import(file);
      } catch (e) {
        // Ignore errors related to missing DOM elements or specific runtime conditions
        // that are hard to mock perfectly, but catch syntax errors.
        if (e instanceof SyntaxError) {
          throw new Error(`${path.relative(EXTENSION_DIR, file)}: ${e.message}`);
        }
      }
    }
  });

  it('should not have circular dependencies', () => {
    const imports = {};
    jsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = content.matchAll(/import .* from ['"](.+)['"]/g);
      const fileImports = [];
      for (const match of matches) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(file), importPath);
          // Add .js extension if missing
          const fullPath = resolvedPath.endsWith('.js') ? resolvedPath : resolvedPath + '.js';
          if (fs.existsSync(fullPath)) {
            fileImports.push(fullPath);
          }
        }
      }
      imports[file] = fileImports;
    });

    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();

    function detectCycle(node, path = []) {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const children = imports[node] || [];
      for (const child of children) {
        if (!visited.has(child)) {
          if (detectCycle(child, path)) return true;
        } else if (recursionStack.has(child)) {
          cycles.push([...path, child].map(p => path.relative(EXTENSION_DIR, p)).join(' -> '));
          return true;
        }
      }

      recursionStack.delete(node);
      path.pop();
      return false;
    }

    Object.keys(imports).forEach(node => {
      if (!visited.has(node)) {
        detectCycle(node);
      }
    });

    expect(cycles).toEqual([]);
  });
});
