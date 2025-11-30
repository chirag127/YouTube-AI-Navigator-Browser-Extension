import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeneralSettings } from '../../../extension/options/modules/general.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  ce: vi.fn().mockReturnValue({
      className: '',
      dataset: {},
      innerHTML: '',
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
  }),
  on: vi.fn(),
  $$: vi.fn().mockReturnValue([]),
  ac: vi.fn(),
  rc: vi.fn(),
}));

import { qs } from '../../../extension/utils/shortcuts/dom.js';

describe('GeneralSettings', () => {
  let settingsManager;
  let autoSave;
  let generalSettings;
  let mockElements = {};

  beforeEach(() => {
    mockElements = {};
    qs.mockImplementation(selector => {
      const id = selector.replace('#', '');
      if (!mockElements[id]) {
        mockElements[id] = {
          value: '',
          checked: false,
          type: 'text',
          appendChild: vi.fn(),
          innerHTML: '',
        };
      }
      return mockElements[id];
    });

    settingsManager = {
      get: vi.fn().mockReturnValue({}),
    };

    autoSave = {
      attachToAll: vi.fn(),
    };

    generalSettings = new GeneralSettings(settingsManager, autoSave);
  });

  it('should initialize with default values', () => {
    generalSettings.init();
    expect(autoSave.attachToAll).toHaveBeenCalled();
  });

  it('should attach auto-save to all fields', () => {
    generalSettings.init();
    expect(autoSave.attachToAll).toHaveBeenCalledWith(expect.objectContaining({
      theme: { path: 'ui.theme' },
      language: { path: 'transcript.language' },
    }));
  });
});
