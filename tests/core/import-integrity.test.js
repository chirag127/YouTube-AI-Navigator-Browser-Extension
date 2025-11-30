import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const getJsFiles = (dir, files = []) => {
  readdirSync(dir).forEach(f => {
    const p = join(dir, f);
    if (statSync(p).isDirectory() && !f.includes('node_modules') && !f.includes('dist')) {
      getJsFiles(p, files);
    } else if (f.endsWith('.js')) {
      files.push(p);
    }
  });
  return files;
};

const extractImports = c => {
  const r = [];
  const staticRe = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicRe = /const\s+{([^}]+)}\s+=\s+await\s+import\([^)]+\)/g;
  let m;
  while ((m = staticRe.exec(c))) {
    const imports = m[1]
      .split(',')
      .map(i => {
        const parts = i.trim().split(/\s+as\s+/);
        return parts[0].trim();
      })
      .filter(Boolean);
    r.push({ imports, path: m[2] });
  }
  while ((m = dynamicRe.exec(c))) {
    const imports = m[1].split(',').map(i => {
      const parts = i.trim().split(/\s*:\s*/);
      return parts[0].trim();
    });
    r.push({ imports, path: 'dynamic' });
  }
  return r;
};

const extractExports = c => {
  const r = [];
  const namedRe =
    /export\s+(?:const|let|var|async\s+function|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const destructRe = /export\s+{([^}]+)}/g;
  let m;
  while ((m = namedRe.exec(c))) r.push(m[1]);
  while ((m = destructRe.exec(c))) {
    m[1].split(',').forEach(e => {
      const parts = e.trim().split(/\s+as\s+/);
      r.push(parts[parts.length - 1].trim());
    });
  }
  return r;
};

describe('Import Integrity', () => {
  it('validates all imports have matching exports', () => {
    const files = getJsFiles('extension');
    const errors = [];
    files.forEach(f => {
      const c = readFileSync(f, 'utf8');
      const imports = extractImports(c);
      imports.forEach(({ imports: names, path }) => {
        if (path === 'dynamic' || path.startsWith('chrome') || !path.startsWith('.')) return;
        const targetPath = join(dirname(f), path);
        try {
          const targetContent = readFileSync(targetPath, 'utf8');
          const exports = extractExports(targetContent);
          names.forEach(n => {
            if (!exports.includes(n)) {
              errors.push(`${f}: Missing export '${n}' in ${path}`);
            }
          });
        } catch (e) {
          errors.push(`${f}: Cannot resolve ${path}`);
        }
      });
    });
    if (errors.length) throw new Error(errors.slice(0, 5).join('\n'));
  });

  it('validates no default exports', () => {
    const files = getJsFiles('extension');
    const errors = [];
    files.forEach(f => {
      const c = readFileSync(f, 'utf8');
      if (/export\s+default/.test(c)) {
        errors.push(f);
      }
    });
    if (errors.length) throw new Error(`Default exports found:\n${errors.slice(0, 5).join('\n')}`);
  });

  it('validates no duplicate shortcut names', () => {
    const shortcuts = getJsFiles('extension/utils/shortcuts');
    const names = new Map();
    shortcuts.forEach(f => {
      const c = readFileSync(f, 'utf8');
      const exports = extractExports(c);
      exports.forEach(e => {
        if (names.has(e)) {
          throw new Error(`Duplicate shortcut '${e}' in ${f} and ${names.get(e)}`);
        }
        names.set(e, f);
      });
    });
  });
});
