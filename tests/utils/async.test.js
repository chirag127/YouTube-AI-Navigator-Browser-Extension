import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { raf } from '../../extension/utils/shortcuts/async.js';

describe('Async Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('raf', () => {
    it('should return a Promise when no callback is provided', async () => {
      const p = raf();
      expect(p).toBeInstanceOf(Promise);

      // Fast-forward time to resolve promise if it falls back to setTimeout
      vi.runAllTimers();
      await p;
    });

    it('should execute callback when provided', () => {
      const cb = vi.fn();
      raf(cb);

      // In test environment requestAnimationFrame might be mocked or fallback to setTimeout
      vi.runAllTimers();

      expect(cb).toHaveBeenCalled();
    });
  });
});
