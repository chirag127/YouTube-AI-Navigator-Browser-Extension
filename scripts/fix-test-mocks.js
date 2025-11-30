import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('tests/**/*.test.js');

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  let modified = false;

  if (content.includes('vi.fn().mockImplementation')) {
    content = content.replace(/vi\.fn\(\)\.mockImplementation\(/g, 'function(');
    modified = true;
  }

  if (content.includes('.mockResolvedValue') || content.includes('.mockRejectedValue')) {
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      if (line.includes('mockResolvedValue') || line.includes('mockRejectedValue')) {
        if (!line.includes('vi.fn()')) {
          return line.replace(/(\w+)\.mock(Resolved|Rejected)Value/, 'vi.mocked($1).mock$2Value');
        }
      }
      return line;
    });
    if (newLines.join('\n') !== content) {
      content = newLines.join('\n');
      modified = true;
    }
  }

  if (modified) {
    writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Mock fixes complete');
