import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIConfig } from '../../../extension/options/modules/ai-config.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  id: vi.fn(),
  on: vi.fn(),
}));

import { qs, id, on } from '../../../extension/utils/shortcuts/dom.js';

describe('AIConfig', () => {
  let settingsManager;
  let autoSave;
  let aiConfig;
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
          classList: {
             add: vi.fn(),
             remove: vi.fn(),
          },
          style: {},
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

    aiConfig = new AIConfig(settingsManager, autoSave);
  });

  it('should initialize with default values', () => {
    aiConfig.init();
    expect(autoSave.attachToAll).toHaveBeenCalled();
  });

  it('should attach auto-save to all fields', () => {
    aiConfig.init();
    expect(autoSave.attachToAll).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: { path: 'ai.apiKey' },
      modelSelect: { path: 'ai.model' },
    }));
  });
});
