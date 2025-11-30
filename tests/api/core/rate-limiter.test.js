import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimiter } from '../../../extension/api/core/rate-limiter.js';
import { to } from '../../../extension/utils/shortcuts/global.js';
import { nw } from '../../../extension/utils/shortcuts/core.js';
import { np } from '../../../extension/utils/shortcuts/async.js';

vi.mock('../../../extension/utils/shortcuts/global.js');
vi.mock('../../../extension/utils/shortcuts/core.js');
vi.mock('../../../extension/utils/shortcuts/async.js');

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    vi.clearAllMocks();
    limiter = new RateLimiter({
      maxRequests: 2,
      windowMs: 1000,
    });
  });

  describe('constructor', () => {
    it('should set default config', () => {
      const defaultLimiter = new RateLimiter();

      expect(defaultLimiter.maxRequests).toBe(15);
      expect(defaultLimiter.windowMs).toBe(60000);
    });

    it('should set custom config', () => {
      expect(limiter.maxRequests).toBe(2);
      expect(limiter.windowMs).toBe(1000);
    });
  });

  describe('acquire', () => {
    it('should resolve immediately when under limit', async () => {
      nw.mockReturnValue(1000);

      await limiter.acquire();

      expect(limiter.queue).toHaveLength(0);
      expect(limiter.timestamps).toHaveLength(1);
    });

    it('should queue when at limit', async () => {
      nw.mockReturnValue(1000);
      np.mockImplementation(fn => {
        const promise = new Promise(fn);
        return promise;
      });
      to.mockImplementation(fn => fn());

      // Fill the limit
      await limiter.acquire();
      await limiter.acquire();

      // This should queue
      const acquirePromise = limiter.acquire();

      expect(limiter.queue).toHaveLength(1);

      // Simulate time passing
      nw.mockReturnValue(2000);

      await acquirePromise;

      expect(limiter.queue).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return current stats', () => {
      nw.mockReturnValue(1000);

      limiter.acquire();

      const stats = limiter.getStats();

      expect(stats.activeRequests).toBe(1);
      expect(stats.maxRequests).toBe(2);
      expect(stats.queueLength).toBe(0);
      expect(stats.available).toBe(1);
    });

    it('should filter old timestamps', () => {
      nw.mockReturnValue(1000);
      limiter.acquire();
      nw.mockReturnValue(2000); // After window

      const stats = limiter.getStats();

      expect(stats.activeRequests).toBe(0);
    });
  });
});
