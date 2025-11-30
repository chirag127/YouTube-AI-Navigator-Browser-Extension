import { describe, it, expect, vi } from 'vitest';
import { parseMarkdown, loadMarked } from '../../extension/lib/marked-loader.js';

describe('parseMarkdown', () => {
    it('should return empty string for falsy input', async () => {
        expect(await parseMarkdown('')).toBe('');
        expect(await parseMarkdown(null)).toBe('');
        expect(await parseMarkdown(undefined)).toBe('');
    });

    it('should parse headers', async () => {
        expect(await parseMarkdown('# Title')).toBe('<h1>Title</h1>');
        expect(await parseMarkdown('## Subtitle')).toBe('<h2>Subtitle</h2>');
        expect(await parseMarkdown('### Section')).toBe('<h3>Section</h3>');
    });

    it('should parse bold text', async () => {
        expect(await parseMarkdown('**bold**')).toBe('<strong>bold</strong>');
        expect(await parseMarkdown('__bold__')).toBe('<strong>bold</strong>');
    });

    it('should parse italic text', async () => {
        expect(await parseMarkdown('*italic*')).toBe('<em>italic</em>');
        expect(await parseMarkdown('_italic_')).toBe('<em>italic</em>');
    });

    it('should parse inline code', async () => {
        expect(await parseMarkdown('`code`')).toBe('<code>code</code>');
    });

    it('should parse code blocks', async () => {
        expect(await parseMarkdown('```\ncode block\n```')).toBe('<pre><code>\ncode block\n</code></pre>');
    });

    it('should parse links', async () => {
        expect(await parseMarkdown('[text](url)')).toBe(
            '<a href="url" target="_blank" rel="noopener noreferrer">text</a>'
        );
    });

    it('should parse timestamps', async () => {
        expect(await parseMarkdown('[1:23]')).toBe(
            '<button class="timestamp-btn" data-time="1:23">1:23</button>'
        );
        expect(await parseMarkdown('[1:23:45]')).toBe(
            '<button class="timestamp-btn" data-time="1:23:45">1:23:45</button>'
        );
    });

    it('should parse unordered lists', async () => {
        expect(await parseMarkdown('* item')).toBe('<ul><li>item</li></ul>');
        expect(await parseMarkdown('- item')).toBe('<ul><li>item</li></ul>');
    });

    it('should parse ordered lists', async () => {
        expect(await parseMarkdown('1. item')).toBe('<ul><li>item</li></ul>');
    });

    it('should handle paragraphs and line breaks', async () => {
        expect(await parseMarkdown('line1\n\nline2')).toBe('<p>line1</p><p>line2</p>');
        expect(await parseMarkdown('line1\nline2')).toBe('<p>line1<br>line2</p>');
    });

    it('should wrap plain text in paragraph', async () => {
        expect(await parseMarkdown('plain text')).toBe('<p>plain text</p>');
    });

    it('should handle complex markdown', async () => {
        const input = '# Title\n\n**bold** and *italic* `code`.\n\n* item1\n* item2\n\n[link](url)';
        const expected =
            '<h1>Title</h1><p><strong>bold</strong> and <em>italic</em> <code>code</code>.</p><p><ul><li>item1</li><li>item2</li></ul></p><p><a href="url" target="_blank" rel="noopener noreferrer">link</a></p>';
        expect(await parseMarkdown(input)).toBe(expected);
    });
});

describe('loadMarked', () => {
    it('should return an object with parse function', async () => {
        const marked = await loadMarked();
        expect(typeof marked.parse).toBe('function');
        expect(await marked.parse('**test**')).toBe('<strong>test</strong>');
    });
});
