import '../tests/setup.js';
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

(async () => {
  console.log('Verifying integrity of ' + jsFiles.length + ' files...');
  for (const file of jsFiles) {
    try {
      await import(file);
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error(`SYNTAX ERROR in ${path.relative(EXTENSION_DIR, file)}:`);
        console.error(e.message);
        process.exit(1);
      }
    }
  }
  console.log('Integrity check passed!');
})();
