import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelManager } from '../extension/api/models.js';

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  w: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/network.js', () => ({
  jf: vi.fn().mockResolvedValue({
    models: [
      { name: 'models/gemini-2.0-flash-exp', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-1.5-pro', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/other-model', supportedGenerationMethods: ['other'] },
    ],
  }),
}));

vi.mock('../extension/utils/shortcuts/array.js', () => ({
  fltr: vi.fn((arr, fn) => arr.filter(fn)),
  mp: vi.fn((arr, fn) => arr.map(fn)),
}));

vi.mock('../extension/utils/shortcuts/string.js', () => ({
  rp: vi.fn((str, search, replace) => str.replace(search, replace)),
}));

describe('ModelManager', () => {
  let manager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ModelManager('test-key', 'https://api.test');
  });

  it('should initialize with API key and base URL', () => {
    expect(manager.apiKey).toBe('test-key');
    expect(manager.baseUrl).toBe('https://api.test');
  });

  it('should fetch models', async () => {
    const models = await manager.fetch();
    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
  });

  it('should filter models by generation method', async () => {
    await manager.fetch();
    expect(manager.models.length).toBeGreaterThan(0);
  });

  it('should get sorted model list', () => {
    manager.models = ['gemini-1.5-pro', 'gemini-2.0-flash-exp'];
    const list = manager.getList();
    expect(list).toBeDefined();
    expect(Array.isArray(list)).toBe(true);
  });

  it('should return default models if fetch fails', async () => {
    const { jf } = await import('../extension/utils/shortcuts/network.js');
    jf.mockRejectedValueOnce(new Error('Network error'));
    await manager.fetch();
    const list = manager.getList();
    expect(list.length).toBeGreaterThan(0);
  });
});
