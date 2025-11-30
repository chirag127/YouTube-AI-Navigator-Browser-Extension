import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SegmentsConfig } from '../../../extension/options/modules/segments.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(),
  ce: vi.fn(),
  on: vi.fn(),
}));

import { qs, ce, on } from '../../../extension/utils/shortcuts/dom.js';

describe('SegmentsConfig', () => {
  let settingsManager;
  let autoSave;
  let segmentsConfig;
  let mockElements = {};

  beforeEach(() => {
    mockElements = {};
    qs.mockImplementation(selector => {
      const id = selector.replace('#', '');
      if (id === 'segmentItemTemplate') {
        return {
          content: {
            cloneNode: vi.fn().mockReturnValue({
              querySelector: vi.fn().mockReturnValue({
                addEventListener: vi.fn(),
                appendChild: vi.fn(),
                value: '',
                style: {},
                dataset: {},
                classList: { add: vi.fn(), remove: vi.fn() },
                textContent: '',
                disabled: false,
              }),
            }),
          },
        };
      }
      if (!mockElements[id]) {
        mockElements[id] = {
          value: '',
          checked: false,
          type: 'text',
          addEventListener: vi.fn(),
          appendChild: vi.fn(),
          innerHTML: '',
        };
      }
      return mockElements[id];
    });

    ce.mockImplementation(() => ({
      className: '',
      innerHTML: '',
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      value: '',
    }));

    settingsManager = {
      get: vi.fn().mockReturnValue({
        segments: {
          categories: {},
        },
      }),
    };

    autoSave = {
      attachToAll: vi.fn(),
      attachToInput: vi.fn(),
    };

    segmentsConfig = new SegmentsConfig(settingsManager, autoSave);
  });

  it('should initialize with default values', () => {
    segmentsConfig.init();
    expect(on).toHaveBeenCalled();
  });
});
