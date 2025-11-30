import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '../extension/options/modules/settings-manager.js';

// Mock storage
const mockStorage = {
  config: {},
};

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(async key => ({ [key]: mockStorage[key] })),
  ss: vi.fn(async data => {
    Object.assign(mockStorage, data);
    return true;
  }),
}));

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/core.js', () => ({
  now: () => Date.now(),
  keys: o => Object.keys(o),
  jp: s => JSON.parse(s),
  js: o => JSON.stringify(o),
  isa: a => Array.isArray(a),
}));

describe('Settings Expansion', () => {
  let settingsManager;

  beforeEach(() => {
    mockStorage.config = {};
    settingsManager = new SettingsManager();
  });

  it('should load new default settings', async () => {
    await settingsManager.load();
    const settings = settingsManager.get();

    expect(settings.ui.fontFamily).toBe('Inter');
    expect(settings.ui.iconStyle).toBe('default');
    expect(settings.ui.accentColor).toBe('#3ea6ff');
    expect(settings.ui.borderRadius).toBe(12);

    expect(settings.ai.baseUrl).toBe('');
    expect(settings.ai.topP).toBe(0.95);
    expect(settings.ai.topK).toBe(40);

    expect(settings.widget.opacity).toBe(95);
    expect(settings.widget.hideOnChannels).toEqual([]);

    expect(settings.advanced.exportFormat).toBe('json');
  });

  it('should persist new settings', async () => {
    await settingsManager.load();

    settingsManager.set('ui.fontFamily', 'Roboto');
    settingsManager.set('ai.topP', 0.5);
    settingsManager.set('widget.opacity', 80);

    await settingsManager.save();

    // Simulate reload
    const newManager = new SettingsManager();
    await newManager.load();
    const settings = newManager.get();

    expect(settings.ui.fontFamily).toBe('Roboto');
    expect(settings.ai.topP).toBe(0.5);
    expect(settings.widget.opacity).toBe(80);
  });

  it('should merge new defaults with existing config', async () => {
    // Simulate old config in storage
    mockStorage.config = {
      ui: { theme: 'light' }, // Missing new keys
      ai: { apiKey: '123' }, // Missing new keys
    };

    await settingsManager.load();
    const settings = settingsManager.get();

    // Old values preserved
    expect(settings.ui.theme).toBe('light');
    expect(settings.ai.apiKey).toBe('123');

    // New defaults added
    expect(settings.ui.fontFamily).toBe('Inter');
    expect(settings.ai.topP).toBe(0.95);
  });
});
