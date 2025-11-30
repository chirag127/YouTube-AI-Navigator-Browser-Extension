import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager, SEGMENT_CATEGORIES, DEFAULT_SEGMENT_CONFIG } from '../extension/options/modules/settings-manager.js';

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
}));
vi.mock('../extension/utils/shortcuts/array.js', () => ({
  isa: vi.fn(x => Array.isArray(x)),
}));

describe('Comprehensive Segment Settings Tests', () => {
  let sm;
  beforeEach(async () => {
    sm = new SettingsManager();
    await sm.load();
  });

  describe('Segment Categories Structure', () => {
    it('should have Content category in SEGMENT_CATEGORIES', () => {
      const content = SEGMENT_CATEGORIES.find(c => c.id === 'content');
      expect(content).toBeDefined();
      expect(content.label).toBe('Content');
      expect(content.color).toBe('#1e90ff');
    });

    it('should have all segment categories', () => {
      const expected = [
        'sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview',
        'music_offtopic', 'poi_highlight', 'filler', 'exclusive_access', 'content'
      ];
      expect(SEGMENT_CATEGORIES.length).toBe(11);
      const ids = SEGMENT_CATEGORIES.map(c => c.id);
      expected.forEach(id => expect(ids).toContain(id));
    });

    it('should have unique colors for all categories', () => {
      const colors = SEGMENT_CATEGORIES.map(c => c.color);
      const unique = new Set(colors);
      expect(unique.size).toBe(SEGMENT_CATEGORIES.length);
    });
  });

  describe('Default Segment Configuration', () => {
    it('should default to ignore for DEFAULT_SEGMENT_CONFIG', () => {
      expect(DEFAULT_SEGMENT_CONFIG.action).toBe('ignore');
      expect(DEFAULT_SEGMENT_CONFIG.speed).toBe(2);
    });

    it('should default content to ignore', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.categories.content.action).toBe('ignore');
    });

    it('should default poi_highlight to ignore', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.categories.poi_highlight.action).toBe('ignore');
    });

    it('should default exclusive_access to ignore', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.categories.exclusive_access.action).toBe('ignore');
    });

    it('should default sponsor to skip', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.categories.sponsor.action).toBe('skip');
    });

    it('should default filler to speed', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.categories.filler.action).toBe('speed');
    });

    it('should have speed=2 for all categories', () => {
      const defs = sm.getDefaults();
      Object.values(defs.segments.categories).forEach(cat => {
        expect(cat.speed).toBe(2);
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should persist segment settings changes', async () => {
      sm.set('segments.categories.content.action', 'skip');
      await sm.save();
      expect(sm.get('segments.categories.content.action')).toBe('skip');
    });

    it('should update speed value correctly', async () => {
      sm.set('segments.categories.filler.speed', 3);
      await sm.save();
      expect(sm.get('segments.categories.filler.speed')).toBe(3);
    });

    it('should preserve all segments after partial update', async () => {
      sm.set('segments.categories.sponsor.action', 'speed');
      await sm.save();
      const cats = sm.get('segments.categories');
      expect(Object.keys(cats).length).toBeGreaterThanOrEqual(11);
    });
  });

  describe('Settings Merge', () => {
    it('should merge loaded settings with defaults', () => {
      const loaded = { segments: { categories: { sponsor: { action: 'ignore', speed: 4 } } } };
      const merged = sm.mergeWithDefaults(loaded);
      expect(merged.segments.categories.sponsor.action).toBe('ignore');
      expect(merged.segments.categories.sponsor.speed).toBe(4);
      expect(merged.segments.categories.content.action).toBe('ignore');
    });

    it('should preserve enabled flag', () => {
      const loaded = { segments: { enabled: false } };
      const merged = sm.mergeWithDefaults(loaded);
      expect(merged.segments.enabled).toBe(false);
    });
  });

  describe('Segment Actions Validation', () => {
    it('should support ignore action', () => {
      sm.set('segments.categories.content.action', 'ignore');
      expect(sm.get('segments.categories.content.action')).toBe('ignore');
    });

    it('should support skip action', () => {
      sm.set('segments.categories.sponsor.action', 'skip');
      expect(sm.get('segments.categories.sponsor.action')).toBe('skip');
    });

    it('should support speed action', () => {
      sm.set('segments.categories.filler.action', 'speed');
      expect(sm.get('segments.categories.filler.action')).toBe('speed');
    });
  });

  describe('Settings Export/Import', () => {
    it('should export settings as JSON', () => {
      const exported = sm.export();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should import settings from JSON', async () => {
      const cfg = sm.getDefaults();
      cfg.segments.categories.content.action = 'skip';
      const json = JSON.stringify(cfg);
      const result = await sm.import(json);
      expect(result).toBe(true);
    });
  });

  describe('Settings Reset', () => {
    it('should reset all settings to defaults', async () => {
      sm.set('segments.categories.content.action', 'skip');
      await sm.reset();
      expect(sm.get('segments.categories.content.action')).toBe('ignore');
    });
  });

  describe('Notification Settings', () => {
    it('should default showNotifications to true', () => {
      const defs = sm.getDefaults();
      expect(defs.segments.showNotifications).toBe(true);
    });

    it('should persist notification changes', () => {
      sm.set('segments.showNotifications', false);
      expect(sm.get('segments.showNotifications')).toBe(false);
    });
  });
});
