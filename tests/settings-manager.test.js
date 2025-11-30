import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SettingsManager,
  SEGMENT_CATEGORIES,
  DEFAULT_SEGMENT_CONFIG,
} from '../extension/options/modules/settings-manager.js';

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(),
  ss: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

describe('SettingsManager', () => {
  let manager;

  beforeEach(() => {
    manager = new SettingsManager();
    vi.clearAllMocks();
  });

  it('initializes with default segment categories populated', () => {
    const defaults = manager.getDefaults();
    expect(defaults.segments.enabled).toBe(false);
    expect(defaults.segments.autoSkip).toBe(false);
    expect(defaults.segments.categories).toBeDefined();
    expect(Object.keys(defaults.segments.categories).length).toBeGreaterThan(0);
  });

  it('includes all segment categories in defaults', () => {
    const defaults = manager.getDefaults();
    SEGMENT_CATEGORIES.forEach(cat => {
      expect(defaults.segments.categories[cat.id]).toBeDefined();
      expect(defaults.segments.categories[cat.id].action).toBeDefined();
      expect(defaults.segments.categories[cat.id].speed).toBeDefined();
    });
  });

  it('sets sponsor category to skip by default', () => {
    const defaults = manager.getDefaults();
    expect(defaults.segments.categories.sponsor.action).toBe('skip');
  });

  it('sets poi_highlight to ignore by default', () => {
    const defaults = manager.getDefaults();
    expect(defaults.segments.categories.poi_highlight.action).toBe('ignore');
  });

  it('sets segments disabled by default', () => {
    const defaults = manager.getDefaults();
    expect(defaults.segments.enabled).toBe(false);
    expect(defaults.segments.autoSkip).toBe(false);
  });

  it('sets most categories to ignore by default', () => {
    const defaults = manager.getDefaults();
    expect(defaults.segments.categories.intro.action).toBe('ignore');
    expect(defaults.segments.categories.outro.action).toBe('ignore');
    expect(defaults.segments.categories.filler.action).toBe('ignore');
  });

  it('merges loaded settings with defaults preserving custom values', () => {
    const loaded = { segments: { categories: { sponsor: { action: 'speed', speed: 3 } } } };
    const merged = manager.mergeWithDefaults(loaded);
    expect(merged.segments.categories.sponsor.action).toBe('speed');
    expect(merged.segments.categories.sponsor.speed).toBe(3);
    expect(merged.segments.categories.selfpromo).toBeDefined();
  });

  it('handles empty loaded settings gracefully', () => {
    const merged = manager.mergeWithDefaults({});
    expect(merged.segments.categories.sponsor).toBeDefined();
  });
});
