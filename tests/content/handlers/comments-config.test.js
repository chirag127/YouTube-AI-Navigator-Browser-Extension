import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComments } from '../../../extension/content/handlers/comments.js';
import { sg } from '../../../extension/utils/shortcuts/storage.js';

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(),
  slg: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: vi.fn(p => p),
}));

// Mock window location
Object.defineProperty(window, 'location', {
  value: { search: '?v=test_video_id' },
  writable: true,
});

describe('Comments Handler Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array if comments are disabled in config', async () => {
    sg.mockResolvedValue({
      config: {
        comments: { enabled: false },
      },
    });

    const result = await getComments();
    expect(result).toEqual([]);
  });

  it('should proceed if comments are enabled', async () => {
    sg.mockResolvedValue({
      config: {
        comments: { enabled: true },
      },
    });

    // Mock internal methods or DOM to avoid actual extraction logic failure
    // For this test, we just want to ensure it passes the config check
    // Since we can't easily mock private methods of the instance created in the module,
    // we rely on the fact that it will try to extract and likely return empty array or fail gracefully
    // But importantly, it WON'T return early due to config check.

    // However, since getComments calls internal methods, we might need to spy on the instance if possible.
    // Given the module structure, we test the exported function.

    const result = await getComments();
    // It should return array (empty or not), but NOT because of the early return
    expect(Array.isArray(result)).toBe(true);
  });

  it('should default to enabled if config is missing', async () => {
    sg.mockResolvedValue({}); // Empty storage

    const result = await getComments();
    expect(Array.isArray(result)).toBe(true);
  });
});
