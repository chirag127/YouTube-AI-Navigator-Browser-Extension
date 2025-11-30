import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationsSettings } from '../../../extension/options/modules/integrations.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  __esModule: true,
  qs: vi.fn(),
  id: vi.fn(),
  ce: vi.fn(),
  on: vi.fn(),
}));

import { qs, id, ce, on } from '../../../extension/utils/shortcuts/dom.js';

describe('IntegrationsSettings', () => {
  let settingsManager;
  let notificationManager;
  let integrationsSettings;
  let mockElements = {};

  beforeEach(() => {
    mockElements = {};
    const mockEl = selector => {
      const elId = selector.replace('#', '');
      if (!mockElements[elId]) {
        mockElements[elId] = {
          value: '',
          checked: false,
          type: 'text',
          addEventListener: vi.fn(),
          appendChild: vi.fn(),
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
          },
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

    integrationsSettings = new IntegrationsSettings(settingsManager, notificationManager);
  });

  it('should initialize with default values', () => {
    integrationsSettings.init();
    expect(id).toHaveBeenCalled();
  });
});
