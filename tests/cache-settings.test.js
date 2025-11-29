import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheSettings } from '../extension/options/modules/cache-settings.js';

vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  on: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  slcc: vi.fn(),
}));

import { qs, on } from '../extension/utils/shortcuts/dom.js';
import { slcc as slc } from '../extension/utils/shortcuts/storage.js';

describe('CacheSettings', () => {
  let cacheSettings;
  let mockSettingsManager;
  let mockAutoSave;

  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
    global.chrome.storage.local.getBytesInUse = vi.fn().mockResolvedValue(1024 * 1024 * 5);

    mockSettingsManager = {
      get: vi.fn(() => ({
        cache: {
          enabled: true,
          ttl: 86400000,
          maxSize: 50,
          transcripts: true,
          comments: true,
          metadata: true,
          segments: true,
          summaries: true,
        },
      })),
    };
    mockAutoSave = {
      attachToAll: vi.fn(),
      notifications: { success: vi.fn(), error: vi.fn() },
    };
    cacheSettings = new CacheSettings(mockSettingsManager, mockAutoSave);
  });

  it('should initialize with cache settings', () => {
    expect(cacheSettings.s).toBe(mockSettingsManager);
    expect(cacheSettings.a).toBe(mockAutoSave);
  });

  it('should initialize UI elements with values', () => {
    const mockElements = {
      cacheEnabled: { checked: false },
      cacheTTL: { value: 0 },
      cacheMaxSize: { value: 0 },
      cacheTranscripts: { checked: false },
      cacheComments: { checked: false },
      cacheMetadata: { checked: false },
      cacheSegments: { checked: false },
      cacheSummaries: { checked: false },
    };

    qs.mockImplementation(selector => {
      const id = selector.replace('#', '');
      return mockElements[id] || null;
    });

    cacheSettings.init();

    expect(mockElements.cacheEnabled.checked).toBe(true);
    expect(mockElements.cacheTTL.value).toBe(24);
    expect(mockElements.cacheMaxSize.value).toBe(50);
  });

  it('should clear cache when button clicked', async () => {
    const mockButton = {};
    qs.mockImplementation(selector => {
      if (selector === '#clearCache') return mockButton;
      return null;
    });
    let clickHandler;
    on.mockImplementation((el, event, handler) => {
      if (el === mockButton && event === 'click') {
        clickHandler = handler;
      }
    });

    cacheSettings.init();
    await clickHandler();

    expect(slc).toHaveBeenCalled();
    expect(mockAutoSave.notifications.success).toHaveBeenCalledWith('Cache cleared');
  });

  it('should view cache stats', async () => {
    const mockButton = {};
    const mockStats = { className: '', textContent: '' };
    qs.mockImplementation(selector => {
      if (selector === '#viewCacheStats') return mockButton;
      if (selector === '#cacheStats') return mockStats;
      return null;
    });
    let clickHandler;
    on.mockImplementation((el, event, handler) => {
      if (el === mockButton && event === 'click') {
        clickHandler = handler;
      }
    });

    cacheSettings.init();
    await clickHandler();

    expect(mockStats.textContent).toContain('5.00 MB');
  });

  it('should attach auto-save to all inputs', () => {
    qs.mockReturnValue(null);

    cacheSettings.init();

    expect(mockAutoSave.attachToAll).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheEnabled: expect.any(Object),
        cacheTTL: expect.any(Object),
        cacheMaxSize: expect.any(Object),
      })
    );
  });
});
