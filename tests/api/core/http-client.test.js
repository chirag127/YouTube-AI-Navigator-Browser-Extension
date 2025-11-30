import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../../extension/api/core/http-client.js';

vi.mock('../../../extension/utils/shortcuts/global.js', () => ({
  to: vi.fn(),
  co: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/math.js', () => ({
  mn: vi.fn((a, b) => Math.min(a, b)),
}));

vi.mock('../../../extension/utils/shortcuts/async.js', () => ({
  np: vi.fn(fn => new Promise(fn)),
}));

describe('HttpClient', () => {
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new HttpClient({
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 1000,
      timeout: 5000,
    });
  });

  describe('constructor', () => {
    it('should set default config', () => {
      const defaultClient = new HttpClient();

      expect(defaultClient.maxRetries).toBe(3);
      expect(defaultClient.timeout).toBe(30000);
    });

    it('should set custom config', () => {
      expect(client.maxRetries).toBe(2);
      expect(client.timeout).toBe(5000);
    });
  });

  describe('fetch', () => {
    it('should return response on success', async () => {
      const mockResponse = { ok: true };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      const { to, co } = await import('../../../extension/utils/shortcuts/global.js');
      to.mockReturnValue('timeoutId');

      const result = await client.fetch('url');

      expect(global.fetch).toHaveBeenCalledWith('url', {
        signal: expect.any(AbortSignal),
      });
      expect(co).toHaveBeenCalledWith('timeoutId');
      expect(result).toEqual(mockResponse);
    });

    it('should retry on retryable status', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests' })
        .mockResolvedValueOnce({ ok: true });
      const { to, co, mn } = await import('../../../extension/utils/shortcuts/global.js');
      to.mockReturnValue('timeoutId');
      mn.mockImplementation((a, b) => Math.min(a, b));

      const result = await client.fetch('url');

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.ok).toBe(true);
    });

    it('should not retry on non-retryable status', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({}),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      const { to, co } = await import('../../../extension/utils/shortcuts/global.js');
      to.mockReturnValue('timeoutId');

      await expect(client.fetch('url')).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle timeout', async () => {
      global.fetch = function(() => {
        const controller = new AbortController();
        controller.abort();
        return Promise.reject(new Error('Aborted'));
      });
      global.fetch.mockRejectedValue(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

      await expect(client.fetch('url')).rejects.toThrow('Request timeout after 5000ms');
    });

    it('should handle network errors', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValue(Object.assign(new Error('Connection reset'), { code: 'ECONNRESET' }));

      await expect(client.fetch('url')).rejects.toThrow('Connection reset');
    });
  });

  describe('_createError', () => {
    it('should create error from response', async () => {
      const mockResponse = {
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({ error: { message: 'Custom error' } }),
      };

      const error = await client._createError(mockResponse);

      expect(error.message).toBe('Custom error');
      expect(error.status).toBe(404);
    });
  });

  describe('_sleep', () => {
    it('should sleep for specified ms', async () => {
      const { to, np } = await import('../../../extension/utils/shortcuts/global.js');
      to.mockImplementation((fn, ms) => setTimeout(fn, ms));
      np.mockImplementation(fn => {
        const promise = new Promise(fn);
        return promise;
      });

      const start = Date.now();
      await client._sleep(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });
});
