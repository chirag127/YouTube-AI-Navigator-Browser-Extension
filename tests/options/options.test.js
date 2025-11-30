// Mock dependencies
vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/global.js', () => ({
  to: vi.fn((cb, d) => setTimeout(cb, d)),
  clt: id => clearTimeout(id),
}));
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  on: vi.fn(),
  qs: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/core.js', () => ({
  oe: vi.fn(),
}));

import { AutoSave } from '../extension/options/modules/auto-save.js';

describe('AutoSave', () => {
  let settingsManager;
  let notificationManager;
  let autoSave;

  beforeEach(() => {
    vi.useFakeTimers();
    settingsManager = {
      update: vi.fn().mockResolvedValue(true),
    };
    notificationManager = {
      saving: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
    };
    autoSave = new AutoSave(settingsManager, 500, notificationManager);
  });

  it('should save settings after delay', async () => {
    autoSave.save('test.path', 'value');
    expect(notificationManager.saving).toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(settingsManager.update).toHaveBeenCalledWith('test.path', 'value');
    // Wait for async promise to resolve
    await Promise.resolve();
    await Promise.resolve();

    expect(notificationManager.success).toHaveBeenCalled();
  });

  it('should debounce multiple saves', async () => {
    autoSave.save('test.path', 'value1');
    autoSave.save('test.path', 'value2');

    vi.advanceTimersByTime(500);

    expect(settingsManager.update).toHaveBeenCalledTimes(1);
    expect(settingsManager.update).toHaveBeenCalledWith('test.path', 'value2');
  });

  it('should handle save errors', async () => {
    settingsManager.update.mockRejectedValue(new Error('Save failed'));

    autoSave.save('test.path', 'value');
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    expect(notificationManager.error).toHaveBeenCalled();
  });
});
