import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
  w: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/runtime.js', () => ({
  gu: p => {
    // Resolve paths relative to extension/content/utils/
    if (p.startsWith('utils/')) return `../../${p}`;
    if (p.startsWith('content/')) return `../../${p}`; // e.g. content/utils/scroll-manager.js -> ../../content/utils/scroll-manager.js (which is same dir?)
    // Actually scroll-manager imports content/utils/scroll-manager.js? No.
    // It imports utils/shortcuts/...
    return p;
  },
}));
vi.mock('../extension/utils/shortcuts/global.js', () => ({
  to: (cb, ms) => {
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
}));

// Mock DOM shortcuts
const mockQs = vi.fn();
const mockQsa = vi.fn();
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: mockQs,
  qsa: mockQsa,
}));

// Mock window and document
global.window = {
  scrollTo: vi.fn(),
  scrollBy: vi.fn(),
  scrollY: 0,
  innerHeight: 1000,
};
global.document = {
  documentElement: {
    scrollHeight: 5000,
    clientHeight: 1000,
    scrollTop: 0,
  },
  body: {
    scrollTop: 0,
  },
};
global.chrome = {
  runtime: {
    getURL: p => {
      if (p.startsWith('utils/')) return `../../${p}`;
      if (p.startsWith('content/')) return `../../${p}`;
      return p;
    },
  },
};

let ScrollManager;
let getScrollManager;

describe('ScrollManager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset window mocks
    global.window.scrollTo.mockReset();
    global.window.scrollBy.mockReset();
    global.window.scrollY = 0;

    // Re-import to ensure fresh state if possible, or just get the exported members
    const module = await import('../extension/content/utils/scroll-manager.js');
    ScrollManager = module.ScrollManager;
    getScrollManager = module.getScrollManager;
  });

  it('should be a singleton', () => {
    const sm1 = getScrollManager();
    const sm2 = getScrollManager();
    expect(sm1).toBe(sm2);
  });

  it('should scroll to comments section directly when found', async () => {
    const sm = getScrollManager();
    const mockCommentsSection = {
      scrollIntoView: vi.fn(),
    };
    mockQs.mockReturnValue(mockCommentsSection);
    mockQsa.mockReturnValue([
      {
        querySelector: sel => {
          if (sel === '#author-text') return { textContent: 'Author' };
          if (sel === '#content-text') return { textContent: 'Comment' };
          return null;
        },
      },
    ]);
    const result = await sm.scrollToComments();
    expect(mockCommentsSection.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(global.window.scrollBy).toHaveBeenCalledWith(0, 200);
    expect(result).toBe(true);
  });

  it('should fallback to bottom scroll when comments section not found', async () => {
    const sm = getScrollManager();
    mockQs.mockReturnValue(null);
    mockQsa.mockReturnValue([
      {
        querySelector: sel => {
          if (sel === '#author-text') return { textContent: 'Author' };
          if (sel === '#content-text') return { textContent: 'Comment' };
          return null;
        },
      },
    ]);
    const result = await sm.scrollToComments();
    expect(global.window.scrollTo).toHaveBeenCalledWith({
      top: 5000,
      behavior: 'smooth',
    });
    expect(result).toBe(true);
  });

  it('should wait for comments to load in DOM', async () => {
    const sm = getScrollManager();
    mockQs.mockReturnValue(null);
    mockQsa.mockReturnValueOnce([]).mockReturnValue([
      {
        querySelector: sel => {
          if (sel === '#author-text') return { textContent: 'Author' };
          if (sel === '#content-text') return { textContent: 'Comment' };
          return null;
        },
      },
    ]);
    const result = await sm.scrollToComments();
    expect(result).toBe(true);
    expect(mockQsa).toHaveBeenCalledWith('ytd-comment-thread-renderer');
  });
});
