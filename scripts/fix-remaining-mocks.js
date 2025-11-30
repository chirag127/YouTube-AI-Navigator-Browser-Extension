import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const files = glob.sync('tests/**/*.test.js');

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  let modified = false;

  // Fix vi.mocked() calls that need to return mock functions
  if (content.includes('vi.mocked(') && content.includes('.mock')) {
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      // Skip if already using vi.fn()
      if (line.includes('vi.fn()')) return line;

      // Fix patterns like: vi.mocked(mockFn).mockResolvedValue
      if (
        line.match(
          /vi\.mocked\((\w+)\)\.(mockResolvedValue|mockRejectedValue|mockReturnValue|mockImplementation)/
        )
      ) {
        return line.replace(/vi\.mocked\((\w+)\)/, '$1');
      }

      // Fix patterns like: mockFn.mockReturnValue (where mockFn is not a vi.fn())
      if (
        line.match(/^\s+(mock\w+)\.(mockReturnValue|mockImplementation)/) &&
        !line.includes('vi.fn()')
      ) {
        const match = line.match(/^\s+(mock\w+)/);
        if (match) {
          const varName = match[1];
          // Check if this variable is defined as vi.fn() in beforeEach
          const hasViFn = content.includes(`${varName} = vi.fn()`);
          if (!hasViFn) {
            // Need to ensure it's a vi.fn()
            return line; // Keep as is, will be fixed by ensuring vi.fn() in setup
          }
        }
      }

      return line;
    });

    if (newLines.join('\n') !== content) {
      content = newLines.join('\n');
      modified = true;
    }
  }

  // Fix syntax errors in mock definitions
  content = content.replace(/parseMarkdown: function\(text =>/g, 'parseMarkdown: (text) =>');
  if (content !== readFileSync(file, 'utf8')) modified = true;

  if (modified) {
    writeFileSync(file, content, 'utf8');
    console.log(`Fixed: ${file}`);
  }
});

console.log('Remaining mock fixes complete');
