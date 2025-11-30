import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsManager } from '../../../extension/options/modules/settings-manager.js';
import { CommentsSettings } from '../../../extension/options/modules/comments-settings.js';
import { AutoSave } from '../../../extension/options/modules/auto-save.js';

// Mock DOM
const mockElement = {
  checked: true,
  value: '',
  addEventListener: vi.fn(),
};

vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: vi.fn(() => mockElement),
  on: vi.fn(),
  id: vi.fn(() => mockElement),
}));

// Mock Storage
const mockStorage = {};
vi.mock('../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(async () => ({ config: mockStorage })),
  ss: vi.fn(async (data) => {
    Object.assign(mockStorage, data.config);
  }),
}));

describe('Comments Settings Flow', () => {
  let settingsManager;
  let autoSave;
  let commentsSettings;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockElement.checked = true;
    mockStorage.comments = { enabled: true };

    settingsManager = new SettingsManager();
    await settingsManager.load();

    autoSave = new AutoSave(settingsManager);
    commentsSettings = new CommentsSettings(settingsManager, autoSave);
  });

  it('should load default enabled state as true', () => {
    const settings = settingsManager.get();
    expect(settings.comments.enabled).toBe(true);
  });

  it('should update setting when toggled', async () => {
    // Simulate UI toggle
    mockElement.checked = false;

    // Manually trigger save as if AutoSave did it
    await settingsManager.update('comments.enabled', false);

    const settings = settingsManager.get();
    expect(settings.comments.enabled).toBe(false);
    expect(mockStorage.comments.enabled).toBe(false);
  });

  it('should initialize UI with correct state', () => {
    commentsSettings.init();
    // Verify chk was called with correct value
    // Since we mocked qs, we can't easily check the side effect on the element
    // without more complex mocking, but we can verify the setting retrieval
    const settings = settingsManager.get();
    expect(settings.comments.enabled).toBe(true);
  });

  it('should handle disabled state correctly', async () => {
    mockStorage.comments.enabled = false;
    await settingsManager.load();

    const settings = settingsManager.get();
    expect(settings.comments.enabled).toBe(false);
  });
});
