import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock runtime first to control gu output
vi.mock('../../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: path => {
    const mapping = {
      'utils/shortcuts/log.js': '../../../utils/shortcuts/log.js',
      'content/ui/components/loading.js': '../components/loading.js',
      'content/utils/dom.js': '../../utils/dom.js',
      'content/utils/time.js': '../../utils/time.js',
      'utils/shortcuts/dom.js': '../../../utils/shortcuts/dom.js',
      'utils/shortcuts/storage.js': '../../../utils/shortcuts/storage.js',
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

vi.mock('../../../../extension/content/utils/dom.js', () => ({
  seekVideo: vi.fn(),
}));

vi.mock('../../../../extension/content/utils/time.js', () => ({
  formatTime: t => `${t}s`,
}));

vi.mock('../../../../extension/utils/shortcuts/dom.js', () => ({
  id: id => document.getElementById(id),
  qs: (sel, ctx) => (ctx || document).querySelector(sel),
  qsa: (sel, ctx) => (ctx || document).querySelectorAll(sel),
  on: (el, evt, cb) => el.addEventListener(evt, cb),
}));

vi.mock('../../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn().mockResolvedValue({ config: { transcript: { autoClose: true } } }),
  ss: vi.fn(),
}));

// Import module under test
import {
  renderTranscript,
  shouldAutoClose,
} from '../../../../extension/content/ui/renderers/transcript.js';

describe('Transcript Renderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    vi.clearAllMocks();
  });

  it('should render transcript lines', () => {
    const data = [
      { start: 0, text: 'Hello' },
      { start: 5, text: 'World' },
    ];

    renderTranscript(container, data);

    const lines = container.querySelectorAll('.ytai-transcript-line');
    expect(lines.length).toBe(2);
    expect(lines[0].querySelector('.ytai-transcript-text').textContent).toBe('Hello');
    expect(lines[1].querySelector('.ytai-transcript-timestamp').textContent).toBe('5s');
  });

  it('should show placeholder if no transcript', () => {
    renderTranscript(container, []);
    expect(container.innerHTML).toContain('No transcript available');
  });

  it('should handle seek on click', async () => {
    const { seekVideo } = await import('../../../../extension/content/utils/dom.js');
    const data = [{ start: 10, text: 'Test' }];

    renderTranscript(container, data);

    const line = container.querySelector('.ytai-transcript-line');
    line.click();

    expect(seekVideo).toHaveBeenCalledWith(10);
  });

  it('should toggle auto-close', async () => {
    const { ss } = await import('../../../../extension/utils/shortcuts/storage.js');
    renderTranscript(container, [{ start: 0, text: 'Test' }]);

    const toggle = container.querySelector('#yt-ai-transcript-autoclose-toggle');
    // Initial state might be true or false depending on async load, but we mocked sg to return true
    // Wait for next tick to ensure async load completes?
    // Actually the IIFE runs on import.

    // We can't easily await the IIFE.
    // But we can check if click triggers ss.

    toggle.click();
    // Wait for async click handler
    await new Promise(r => setTimeout(r, 0));

    expect(ss).toHaveBeenCalled();
  });
});
