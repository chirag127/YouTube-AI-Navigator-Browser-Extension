import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, resolve, dirname } from 'path';

const getAllJsFiles = dir => {
    let files = [];
    const items = readdirSync(dir);
    for (const item of items) {
        const path = join(dir, item);
        if (statSync(path).isDirectory()) {
            if (!item.includes('node_modules') && !item.includes('.git') && !item.includes('tests')) {
                files = files.concat(getAllJsFiles(path));
            }
        } else if (item.endsWith('.js')) {
            files.push(path);
        }
    }
    return files;
};

const parseImports = content => {
    const imports = [];
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const names = match[1].split(',').map(n => {
            const parts = n.trim().split(/\s+as\s+/);
            return parts[0].trim();
        });
        imports.push({ names, path: match[2] });
    }
    return imports;
};

const parseExports = content => {
    const exports = [];
    const patterns = [
        /export\s+const\s+(\w+)\s*=/g,
        /export\s+class\s+(\w+)/g,
        /export\s+async\s+function\s+(\w+)/g,
        /export\s+function\s+(\w+)/g,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            exports.push(match[1]);
        }
    }
    return exports;
};

describe('Import/Export Validation', () => {
    it('should validate all imports match actual exports', () => {
        const extensionFiles = getAllJsFiles('extension');
        const errors = [];

        for (const file of extensionFiles) {
            const content = readFileSync(file, 'utf-8');
            const imports = parseImports(content);

            for (const imp of imports) {
                if (imp.path.startsWith('.')) {
                    const fileDir = dirname(file);
                    let targetPath = resolve(fileDir, imp.path);
                    if (!targetPath.endsWith('.js')) targetPath += '.js';

                    try {
                        const targetContent = readFileSync(targetPath, 'utf-8');
                        const exports = parseExports(targetContent);

                        for (const name of imp.names) {
                            if (!exports.includes(name)) {
                                errors.push({
                                    file: relative('', file).replace(/\\/g, '/'),
                                    import: name,
                                    from: imp.path,
                                    target: relative('', targetPath).replace(/\\/g, '/'),
                                    availableExports: exports.slice(0, 10),
                                });
                            }
                        }
                    } catch (e) {
                        // Skip missing files
                    }
                }
            }
        }

        if (errors.length > 0) {
            console.error(`\n❌ Found ${errors.length} import/export mismatches:\n`);
            const grouped = {};
            errors.forEach(err => {
                const key = `${err.from}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(err);
            });

            Object.entries(grouped).slice(0, 20).forEach(([from, errs]) => {
                console.error(`\n📁 From: ${from}`);
                errs.slice(0, 5).forEach(err => {
                    console.error(`  ❌ '${err.import}' not found`);
                    console.error(`     Available: ${err.availableExports.join(', ')}`);
                    console.error(`     In: ${err.file}`);
                });
            });
            console.error(`\n... and ${errors.length - 20} more errors\n`);
        }

        expect(errors).toEqual([]);
    });
});
