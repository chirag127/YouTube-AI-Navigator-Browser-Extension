import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsSettings } from '../../../extension/options/modules/notifications-settings.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  id: vi.fn(),
}));

import { qs, id } from '../../../extension/utils/shortcuts/dom.js';

describe('NotificationsSettings', () => {
  let settingsManager;
  let autoSave;
  let notificationsSettings;
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
        };
      }
      return mockElements[elId];
    };

    qs.mockImplementation(mockEl);
    id.mockImplementation(mockEl);

    settingsManager = {
      get: vi.fn().mockReturnValue({}),
    };

    autoSave = {
      attachToAll: vi.fn(),
    };

    notificationsSettings = new NotificationsSettings(settingsManager, autoSave);
  });

  it('should initialize with default values', () => {
    notificationsSettings.init();
    expect(autoSave.attachToAll).toHaveBeenCalled();
  });
});
