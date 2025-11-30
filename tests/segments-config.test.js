import { describe, it, expect } from 'vitest';
import { SettingsManager } from '../extension/options/modules/settings-manager.js';

describe('Segment Configuration', () => {
  it('default config includes all segment categories', () => {
    const sm = new SettingsManager();
    const d = sm.getDefaults();
    expect(d.segments.enabled).toBe(false);
    expect(d.segments.autoSkip).toBe(false);
    expect(d.segments.categories.sponsor).toEqual({ action: 'skip', speed: 2 });
    expect(d.segments.categories.selfpromo).toEqual({ action: 'skip', speed: 2 });
    expect(d.segments.categories.interaction).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.intro).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.outro).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.preview).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.music_offtopic).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.poi_highlight).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.filler).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.exclusive_access).toEqual({ action: 'ignore', speed: 2 });
    expect(d.segments.categories.content).toEqual({ action: 'ignore', speed: 1 });
  });

  it('merges loaded settings preserving custom category configs', () => {
    const sm = new SettingsManager();
    const loaded = {
      segments: {
        enabled: false,
        categories: { sponsor: { action: 'speed', speed: 3 } },
      },
    };
    const merged = sm.mergeWithDefaults(loaded);
    expect(merged.segments.enabled).toBe(false);
    expect(merged.segments.categories.sponsor.action).toBe('speed');
    expect(merged.segments.categories.sponsor.speed).toBe(3);
    expect(merged.segments.categories.selfpromo).toBeDefined();
  });
});
