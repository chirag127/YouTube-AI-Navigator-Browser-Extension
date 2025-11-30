import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock runtime first to control gu output
vi.mock('../../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: path => {
    const mapping = {
      'content/core/state.js': '../../core/state.js',
      'content/ui/components/loading.js': '../components/loading.js',
      'content/handlers/comments.js': '../../handlers/comments.js',
      'lib/marked-loader.js': '../../../lib/marked-loader.js',
      'utils/shortcuts/runtime.js': '../../../utils/shortcuts/runtime.js',
      'utils/shortcuts/storage.js': '../../../utils/shortcuts/storage.js',
      'utils/shortcuts/global.js': '../../../utils/shortcuts/global.js',
      'utils/shortcuts/log.js': '../../../utils/shortcuts/log.js',
      'utils/shortcuts/core.js': '../../../utils/shortcuts/core.js',
      'utils/shortcuts/string.js': '../../../utils/shortcuts/string.js',
      'utils/shortcuts/dom.js': '../../../utils/shortcuts/dom.js',
    };
    return mapping[path] || path;
  },
  rs: vi.fn(),
}));

// Mock dependencies
vi.mock('../../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../../extension/content/core/state.js', () => ({
  state: {},
}));

vi.mock('../../../../extension/content/ui/components/loading.js', () => ({
  showLoading: vi.fn(),
  showPlaceholder: (c, msg) => {
    c.innerHTML = `<div class="placeholder">${msg}</div>`;
  },
}));

vi.mock('../../../../extension/content/handlers/comments.js', () => ({
  getComments: vi.fn(),
}));

vi.mock('../../../../extension/lib/marked-loader.js', () => ({
  parseMarkdown: (text) => Promise.resolve(`<p>${text}</p>`),
}));

vi.mock('../../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn().mockResolvedValue({ config: {} }),
}));

vi.mock('../../../../extension/utils/shortcuts/global.js', () => ({
  to: cb => cb(),
}));

vi.mock('../../../../extension/utils/shortcuts/core.js', () => ({
  mp: (arr, cb) => arr.map(cb),
}));

vi.mock('../../../../extension/utils/shortcuts/string.js', () => ({
  jn: (arr, sep) => arr.join(sep),
  slc: (arr, s, e) => arr.slice(s, e),
}));

vi.mock('../../../../extension/utils/shortcuts/dom.js', () => ({
  ce: tag => document.createElement(tag),
  ap: (p, c) => p.appendChild(c),
  ih: (el, html) => {
    el.innerHTML = html;
  },
  txt: (el, t) => {
    el.textContent = t;
  },
  dc: {
    querySelector: vi.fn(),
    body: document.createElement('body'),
    documentElement: { scrollHeight: 1000 },
  },
}));

// Import module under test
import { renderComments } from '../../../../extension/content/ui/renderers/comments.js';
import { state } from '../../../../extension/content/core/state.js';
import { getComments } from '../../../../extension/content/handlers/comments.js';
import { rs } from '../../../../extension/utils/shortcuts/runtime.js';

describe('Comments Renderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    state.analysisData = null;
    vi.clearAllMocks();
  });

  it('should render existing analysis if present', async () => {
    state.analysisData = { commentAnalysis: 'Existing Analysis' };
    await renderComments(container);
    expect(container.innerHTML).toContain('Existing Analysis');
    expect(container.innerHTML).toContain('yt-ai-card');
  });

  it('should fetch and analyze comments if no existing analysis', async () => {
    getComments.mockResolvedValue([{ author: 'User', text: 'Comment', likes: 10 }]);
    rs.mockResolvedValue({ success: true, analysis: 'New Analysis' });

    await renderComments(container);

    expect(getComments).toHaveBeenCalled();
    expect(rs).toHaveBeenCalledWith(expect.objectContaining({ action: 'ANALYZE_COMMENTS' }));
    expect(container.innerHTML).toContain('New Analysis');
    expect(container.innerHTML).toContain('User');
    expect(container.innerHTML).toContain('Comment');
  });

  it('should show placeholder if no comments found', async () => {
    getComments.mockResolvedValue([]);
    await renderComments(container);
    expect(container.innerHTML).toContain('No comments found');
  });

  it('should handle errors gracefully', async () => {
    getComments.mockRejectedValue(new Error('Fetch failed'));
    await renderComments(container);
    expect(container.innerHTML).toContain('Failed: Fetch failed');
  });
});
