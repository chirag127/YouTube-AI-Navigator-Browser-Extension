import { describe, it, expect, vi } from 'vitest';
import { parseMarkdown, loadMarked } from '../../extension/lib/marked-loader.js';

describe('parseMarkdown', () => {
    it('should return empty string for falsy input', () => {
        expect(parseMarkdown('')).toBe('');
        expect(parseMarkdown(null)).toBe('');
        expect(parseMarkdown(undefined)).toBe('');
    });

    it('should parse headers', () => {
        expect(parseMarkdown('# Title')).toBe('<h1>Title</h1>');
        expect(parseMarkdown('## Subtitle')).toBe('<h2>Subtitle</h2>');
        expect(parseMarkdown('### Section')).toBe('<h3>Section</h3>');
    });

    it('should parse bold text', () => {
        expect(parseMarkdown('**bold**')).toBe('<strong>bold</strong>');
        expect(parseMarkdown('__bold__')).toBe('<strong>bold</strong>');
    });

    it('should parse italic text', () => {
        expect(parseMarkdown('*italic*')).toBe('<em>italic</em>');
        expect(parseMarkdown('_italic_')).toBe('<em>italic</em>');
    });

    it('should parse inline code', () => {
        expect(parseMarkdown('`code`')).toBe('<code>code</code>');
    });

    it('should parse code blocks', () => {
        expect(parseMarkdown('```\ncode block\n```')).toBe('<pre><code>\ncode block\n</code></pre>');
    });

    it('should parse links', () => {
        expect(parseMarkdown('[text](url)')).toBe('<a href="url" target="_blank" rel="noopener noreferrer">text</a>');
    });

    it('should parse timestamps', () => {
        expect(parseMarkdown('[1:23]')).toBe('<button class="timestamp-btn" data-time="1:23">1:23</button>');
        expect(parseMarkdown('[1:23:45]')).toBe('<button class="timestamp-btn" data-time="1:23:45">1:23:45</button>');
    });

    it('should parse unordered lists', () => {
        expect(parseMarkdown('* item')).toBe('<ul><li>item</li></ul>');
        expect(parseMarkdown('- item')).toBe('<ul><li>item</li></ul>');
    });

    it('should parse ordered lists', () => {
        expect(parseMarkdown('1. item')).toBe('<ul><li>item</li></ul>');
    });

    it('should handle paragraphs and line breaks', () => {
        expect(parseMarkdown('line1\n\nline2')).toBe('<p>line1</p><p>line2</p>');
        expect(parseMarkdown('line1\nline2')).toBe('<p>line1<br>line2</p>');
    });

    it('should wrap plain text in paragraph', () => {
        expect(parseMarkdown('plain text')).toBe('<p>plain text</p>');
    });

    it('should handle complex markdown', () => {
        const input = '# Title\n\n**bold** and *italic* `code`.\n\n* item1\n* item2\n\n[link](url)';
        const expected = '<h1>Title</h1><p><strong>bold</strong> and <em>italic</em> <code>code</code>.</p><p><ul><li>item1</li><li>item2</li></ul></p><p><a href="url" target="_blank" rel="noopener noreferrer">link</a></p>';
        expect(parseMarkdown(input)).toBe(expected);
    });
});

describe('loadMarked', () => {
    it('should return an object with parse function', async () => {
        const marked = await loadMarked();
        expect(typeof marked.parse).toBe('function');
        expect(marked.parse('**test**')).toBe('<strong>test</strong>');
    });
});