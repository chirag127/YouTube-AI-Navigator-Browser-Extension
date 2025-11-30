import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WidgetSettings } from '../../../extension/options/modules/widget-settings.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  __esModule: true,
  qs: vi.fn(),
  id: vi.fn(),
  ce: vi.fn(),
  on: vi.fn(),
}));

import { qs, id, ce, on } from '../../../extension/utils/shortcuts/dom.js';

describe('WidgetSettings', () => {
  let settingsManager;
  let notificationManager;
  let widgetSettings;
  let mockElements = {};

  beforeEach(() => {
    mockElements = {};
    const mockEl = (selector) => {
      const elId = selector.replace('#', '');
      if (!mockElements[elId]) {
        mockElements[elId] = {
          value: '',
          checked: false,
          type: 'text',
          addEventListener: vi.fn(),
          appendChild: vi.fn(),
        };
      }
      return mockElements[elId];
    };

    qs.mockImplementation(mockEl);
    id.mockImplementation(mockEl);
    ce.mockImplementation(() => ({
        className: '',
        innerHTML: '',
        appendChild: vi.fn(),
        addEventListener: vi.fn(),
    }));

    settingsManager = {
      get: vi.fn().mockReturnValue({}),
      set: vi.fn(),
      save: vi.fn(),
    };

    notificationManager = {
      success: vi.fn(),
    };

    widgetSettings = new WidgetSettings(settingsManager, notificationManager);
  });

  it('should initialize with default values', () => {
    widgetSettings.init();
    expect(id).toHaveBeenCalled();
  });
});
