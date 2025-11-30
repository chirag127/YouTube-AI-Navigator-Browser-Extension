import { extract } from '../extension/content/transcript/strategies/dom-automation.js';

// Mock dependencies
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  $: vi.fn(),
  $$: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));
vi.mock('../extension/utils/config.js', () => ({
  getCfg: vi.fn(() => ({
    load: vi.fn().mockResolvedValue({ tr: { as: true } }),
  })),
}));
vi.mock('../extension/utils/shortcuts/time.js', () => ({
  stt: (fn, ms) => setTimeout(fn, ms),
}));
vi.mock('../extension/utils/shortcuts/core.js', () => ({
  now: () => Date.now(),
}));
vi.mock('../extension/utils/shortcuts/string.js', () => ({
  trm: s => s.trim(),
}));
vi.mock('../extension/utils/shortcuts/runtime.js', () => ({
  gu: p => {
    // Resolve relative to dom-automation.js (extension/content/transcript/strategies/)
    if (p.startsWith('utils/')) return '../../../' + p;
    return p;
  },
}));

import { $, $$ } from '../extension/utils/shortcuts/dom.js';
import { getCfg } from '../extension/utils/config.js';

describe('Transcript Extractor (DOM Automation)', () => {
  let mockPanel;
  let mockScrollTo;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;
    window.scrollY = 100; // Initial scroll position

    mockPanel = {
      visibility: 'hidden',
      offsetParent: null,
      click: vi.fn(),
      querySelector: vi.fn(),
    };

    $.mockImplementation(sel => {
      if (sel.includes('engagement-panel')) return mockPanel;
      if (sel.includes('Show transcript')) return { click: vi.fn() };
      if (sel === 'ytd-transcript-segment-renderer') return { offsetParent: document.body };
      return null;
    });

    $$.mockImplementation(() => []);
  });

  it('should extract transcript and restore scroll position', async () => {
    // Setup mock segments
    const mockSegment = {
      querySelector: sel => {
        if (sel === '.segment-timestamp') return { textContent: '0:00' };
        if (sel === '.segment-text') return { textContent: 'Hello world' };
        return null;
      },
    };
    $$.mockReturnValue([mockSegment]);

    // Mock panel becoming visible
    mockPanel.visibility = 'visible';
    mockPanel.offsetParent = document.body;

    const result = await extract();

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Hello world');
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' });
  });

  it('should not scroll if setting is disabled', async () => {
    getCfg.mockReturnValue({
      load: vi.fn().mockResolvedValue({ tr: { as: false } }),
    });

    const mockSegment = {
      querySelector: sel => {
        if (sel === '.segment-timestamp') return { textContent: '0:00' };
        if (sel === '.segment-text') return { textContent: 'Hello world' };
        return null;
      },
    };
    $$.mockReturnValue([mockSegment]);
    mockPanel.visibility = 'visible';
    mockPanel.offsetParent = document.body;

    await extract();

    expect(mockScrollTo).not.toHaveBeenCalled();
  });
});
