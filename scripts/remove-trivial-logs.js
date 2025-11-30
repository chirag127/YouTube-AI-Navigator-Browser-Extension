const fs = require('fs');
const path = require('path');
const glob = require('glob');

const extensionDir = path.resolve(__dirname, '../extension');

const files = glob.sync('**/*.js', { cwd: extensionDir });

let totalRemoved = 0;

files.forEach(file => {
  const filePath = path.join(extensionDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove all l( lines
  content = content.replace(/^\s*l\([^;]*\);\s*$/gm, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const removed = (original.match(/l\([^;]*\);/g) || []).length;
    totalRemoved += removed;
    console.log(`Removed ${removed} logs from ${file}`);
  }
});

console.log(`Total logs removed: ${totalRemoved}`);
