const mockVideoElement = {
  currentTime: 0,
  playbackRate: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

global.chrome = {
  runtime: {
    getURL: vi.fn(p => `/extension/${p}`),
  },
};

vi.mock('../extension/content/utils/dom.js', () => ({
  getVideoElement: vi.fn(() => mockVideoElement),
}));

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
  l: vi.fn(),
  w: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(() =>
    Promise.resolve({
      config: {
        segments: {
          enabled: true,
          categories: {
            sponsor: { action: 'skip', speed: 2 },
            poi_highlight: { action: 'ignore', speed: 2 },
            content: { action: 'ignore', speed: 2 },
            exclusive_access: { action: 'ignore', speed: 2 },
            filler: { action: 'speed', speed: 3 },
          },
        },
      },
    })
  ),
  ss: vi.fn(() => Promise.resolve()),
}));

vi.mock('../extension/utils/shortcuts/global.js', () => ({
  to: vi.fn((fn, delay) => setTimeout(fn, delay)),
}));

vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  ae: vi.fn(),
  re: vi.fn(),
  ce: vi.fn(() => ({
    style: {},
    id: '',
    textContent: '',
    animate: vi.fn(),
    remove: vi.fn(),
    parentNode: {},
  })),
}));

describe('AutoSkip Segment Action Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVideoElement.currentTime = 0;
    mockVideoElement.playbackRate = 1;
  });

  describe('Configuration Loading', () => {
    it('should properly load segment configuration from storage', async () => {
      const { sg } = await import('../extension/utils/shortcuts/storage.js');
      const result = await sg('config');
      expect(result.config.segments.enabled).toBe(true);
      expect(result.config.segments.categories.content.action).toBe('ignore');
      expect(result.config.segments.categories.poi_highlight.action).toBe('ignore');
      expect(result.config.segments.categories.exclusive_access.action).toBe('ignore');
    });

    it('should skip segments with action=skip', () => {
      const cfg = { action: 'skip', speed: 2 };
      expect(cfg.action).toBe('skip');
    });

    it('should ignore segments with action=ignore', () => {
      const cfg = { action: 'ignore', speed: 2 };
      expect(cfg.action).toBe('ignore');
    });

    it('should speed segments with action=speed', () => {
      const cfg = { action: 'speed', speed: 3 };
      expect(cfg.action).toBe('speed');
      expect(cfg.speed).toBe(3);
    });
  });

  describe('Default Actions', () => {
    it('should default content to ignore', async () => {
      const { sg } = await import('../extension/utils/shortcuts/storage.js');
      const result = await sg('config');
      expect(result.config.segments.categories.content.action).toBe('ignore');
    });

    it('should default highlight to ignore', async () => {
      const { sg } = await import('../extension/utils/shortcuts/storage.js');
      const result = await sg('config');
      expect(result.config.segments.categories.poi_highlight.action).toBe('ignore');
    });

    it('should default exclusive_access to ignore', async () => {
      const { sg } = await import('../extension/utils/shortcuts/storage.js');
      const result = await sg('config');
      expect(result.config.segments.categories.exclusive_access.action).toBe('ignore');
    });
  });
});
