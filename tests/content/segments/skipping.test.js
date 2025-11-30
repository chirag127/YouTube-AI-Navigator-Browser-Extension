// Mock chrome global
global.chrome = {
  runtime: {
    getURL: p => {
      // Calculate relative path from the source file (autoskip.js) to the target
      // autoskip.js is in extension/content/segments/
      // target is in extension/
      // p is like 'utils/shortcuts/log.js'
      // We want '../../utils/shortcuts/log.js'
      return '../../' + p;
    },
  },
};

// Mock dependencies
// We need to mock the paths as they will be imported by the source file

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));
// Don't mock content/utils/dom.js, let it use the mocked shortcuts/dom.js
// vi.mock('../extension/content/utils/dom.js', () => ({
//   getVideoElement: vi.fn(),
// }));
vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/global.js', () => ({
  to: vi.fn(cb => cb()),
}));

const qsMock = vi.fn();
const aeMock = vi.fn();
const reMock = vi.fn();
const ceMock = vi.fn(() => ({
  style: {},
  animate: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: qsMock,
  ae: aeMock,
  re: reMock,
  ce: ceMock,
}));

// Now import the module under test
const { setupAutoSkip, handleAutoSkip } = await import('../extension/content/segments/autoskip.js');
const { sg } = await import('../extension/utils/shortcuts/storage.js');

describe('AutoSkip', () => {
  let videoMock;

  beforeEach(() => {
    videoMock = {
      currentTime: 0,
      playbackRate: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Configure qs to return videoMock when asked for 'video'
    qsMock.mockImplementation(sel => {
      if (sel === 'video') return videoMock;
      return null;
    });

    // Reset other mocks
    aeMock.mockClear();
    reMock.mockClear();

    sg.mockResolvedValue({
      config: {
        segments: {
          enabled: true,
          categories: {
            sponsor: { action: 'skip' },
            intro: { action: 'speed', speed: 2 },
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should skip sponsor segments when enabled', async () => {
    sg.mockResolvedValue({
      config: {
        segments: {
          enabled: true,
          autoSkip: true,
          categories: {
            sponsor: { action: 'skip', speed: 2 },
          },
        },
      },
    });
    const segments = [{ label: 'Sponsor', start: 10, end: 20 }];
    await setupAutoSkip(segments);

    videoMock.currentTime = 15;
    handleAutoSkip();

    expect(videoMock.currentTime).toBeCloseTo(20.1);
  });

  it('should speed up intro segments when configured', async () => {
    sg.mockResolvedValue({
      config: {
        segments: {
          enabled: true,
          autoSkip: true,
          categories: {
            intro: { action: 'speed', speed: 2 },
          },
        },
      },
    });
    const segments = [{ label: 'Intermission/Intro Animation', start: 0, end: 10 }];
    await setupAutoSkip(segments);

    videoMock.currentTime = 5;
    handleAutoSkip();

    expect(videoMock.playbackRate).toBe(2);
  });

  it('should restore speed after segment', async () => {
    sg.mockResolvedValue({
      config: {
        segments: {
          enabled: true,
          autoSkip: true,
          categories: {
            intro: { action: 'speed', speed: 2 },
          },
        },
      },
    });
    const segments = [{ label: 'Intermission/Intro Animation', start: 0, end: 10 }];
    await setupAutoSkip(segments);

    videoMock.currentTime = 5;
    handleAutoSkip();
    expect(videoMock.playbackRate).toBe(2);

    videoMock.currentTime = 11;
    handleAutoSkip();
    expect(videoMock.playbackRate).toBe(1);
  });
});
