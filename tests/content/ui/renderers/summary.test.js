import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock runtime first to control gu output
vi.mock('../../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: path => {
    const mapping = {
      'utils/shortcuts/log.js': '../../../utils/shortcuts/log.js',
      'content/ui/components/loading.js': '../components/loading.js',
      'content/utils/timestamps.js': '../../utils/timestamps.js',
      'lib/marked-loader.js': '../../../lib/marked-loader.js',
    };
    return mapping[path] || path;
  },
}));

// Mock dependencies
vi.mock('../../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../../extension/content/ui/components/loading.js', () => ({
  showPlaceholder: (c, msg) => {
    c.innerHTML = `<div class="placeholder">${msg}</div>`;
  },
}));

vi.mock('../../../../extension/content/utils/timestamps.js', () => ({
  makeTimestampsClickable: vi.fn(),
}));

vi.mock('../../../../extension/lib/marked-loader.js', () => ({
  parseMarkdown: (text) => Promise.resolve(`<p>${text}</p>`),
}));

// Import module under test
import { renderSummary } from '../../../../extension/content/ui/renderers/summary.js';

describe('Summary Renderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  it('should render summary, insights, and faq', async () => {
    const data = {
      summary: 'My Summary',
      insights: 'My Insights',
      faq: 'My FAQ',
    };

    await renderSummary(container, data);

    expect(container.innerHTML).toContain('My Summary');
    expect(container.innerHTML).toContain('My Insights');
    expect(container.innerHTML).toContain('My FAQ');
    expect(container.querySelectorAll('.yt-ai-card').length).toBe(3);
  });

  it('should show placeholder if no data', async () => {
    await renderSummary(container, null);
    expect(container.innerHTML).toContain('Analysis not started yet');
  });

  it('should handle missing sections', async () => {
    const data = {
      summary: 'My Summary',
    };

    await renderSummary(container, data);

    expect(container.innerHTML).toContain('My Summary');
    expect(container.innerHTML).toContain('No insights available');
    expect(container.innerHTML).toContain('No FAQ available');
  });
});
