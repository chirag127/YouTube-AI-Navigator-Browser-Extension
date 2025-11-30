import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SegmentsConfig } from '../extension/options/modules/segments.js';
import {
  SettingsManager,
  SEGMENT_CATEGORIES,
} from '../extension/options/modules/settings-manager.js';

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(() => Promise.resolve({ config: {} })),
  ss: vi.fn(() => Promise.resolve()),
}));
vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
  l: vi.fn(),
  w: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/core.js', () => ({
  now: vi.fn(() => Date.now()),
  keys: vi.fn(obj => Object.keys(obj)),
  jp: vi.fn(str => JSON.parse(str)),
  js: vi.fn((obj, a, b) => JSON.stringify(obj, a, b)),
  pf: vi.fn(v => parseFloat(v)),
}));
vi.mock('../extension/utils/shortcuts/array.js', () => ({
  isa: vi.fn(x => Array.isArray(x)),
}));
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(sel => {
    if (sel === '#enableSegments') return { checked: true };
    if (sel === '#segmentsGrid') return { innerHTML: '', appendChild: vi.fn() };
    if (sel === '#segmentItemTemplate')
      return {
        content: {
          cloneNode: () => ({
            querySelector: vi.fn(() => ({
              dataset: {},
              style: {},
              textContent: '',
              value: '',
              classList: { add: vi.fn(), remove: vi.fn() },
            })),
            appendChild: vi.fn(),
          }),
        },
      };
    return null;
  }),
  on: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/global.js', () => ({
  pf: vi.fn(v => parseFloat(v)),
}));

describe('Segments UI Module Tests', () => {
  let sm, sc, mockAutoSave;

  beforeEach(async () => {
    sm = new SettingsManager();
    await sm.load();
    mockAutoSave = { save: vi.fn() };
    sc = new SegmentsConfig(sm, mockAutoSave);
  });

  describe('Initialization', () => {
    it('should initialize with settings manager', () => {
      expect(sc.s).toBe(sm);
      expect(sc.a).toBe(mockAutoSave);
    });

    it('should read enabled state from settings', () => {
      sm.set('segments.enabled', true);
      expect(sm.get('segments.enabled')).toBe(true);
    });
  });

  describe('Bulk Operations', () => {
    it('should setAll to skip', async () => {
      await sc.setAll('skip');
      const cats = sm.get('segments.categories');
      SEGMENT_CATEGORIES.forEach(cat => {
        expect(cats[cat.id].action).toBe('skip');
      });
    });

    it('should setAll to speed', async () => {
      await sc.setAll('speed');
      const cats = sm.get('segments.categories');
      SEGMENT_CATEGORIES.forEach(cat => {
        expect(cats[cat.id].action).toBe('speed');
      });
    });

    it('should setAll to ignore', async () => {
      await sc.setAll('ignore');
      const cats = sm.get('segments.categories');
      SEGMENT_CATEGORIES.forEach(cat => {
        expect(cats[cat.id].action).toBe('ignore');
      });
    });

    it('should preserve speed when changing action', async () => {
      sm.set('segments.categories.filler.speed', 3);
      await sc.setAll('skip');
      expect(sm.get('segments.categories.filler.speed')).toBe(3);
    });
  });

  describe('Individual Updates', () => {
    it('should update single category action', async () => {
      await sc.update('content', { action: 'skip' });
      expect(sm.get('segments.categories.content.action')).toBe('skip');
    });

    it('should update single category speed', async () => {
      await sc.update('filler', { speed: 4 });
      expect(sm.get('segments.categories.filler.speed')).toBe(4);
    });

    it('should create category config if missing', async () => {
      sm.set('segments.categories', {});
      await sc.update('sponsor', { action: 'ignore' });
      expect(sm.get('segments.categories.sponsor.action')).toBe('ignore');
    });
  });

  describe('Settings Synchronization', () => {
    it('should call SettingsManager save on update', async () => {
      const saveSpy = vi.spyOn(sm, 'save');
      await sc.update('content', { action: 'skip' });
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should call SettingsManager save on setAll', async () => {
      const saveSpy = vi.spyOn(sm, 'save');
      await sc.setAll('ignore');
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
