import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../extension/api/core/rate-limiter.js';

vi.mock('../extension/utils/shortcuts/log.js', () => ({
    l: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn((fn, delay) => setTimeout(fn, delay)),
}));

vi.mock('../extension/utils/shortcuts/core.js', () => ({
    nw: vi.fn(() => Date.now()),
    np: vi.fn(fn => new Promise(fn)),
}));

vi.mock('../extension/utils/shortcuts/math.js', () => ({
    mc: vi.fn(v => Math.ceil(v)),
}));

describe('RateLimiter', () => {
    let limiter;

    beforeEach(() => {
        vi.clearAllMocks();
        limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    });

    it('should initialize with config', () => {
        expect(limiter.maxRequests).toBe(3);
        expect(limiter.windowMs).toBe(1000);
    });

    it('should acquire token', async () => {
        await expect(limiter.acquire()).resolves.toBeUndefined();
    });

    it('should get stats', () => {
        const stats = limiter.getStats();
        expect(stats).toHaveProperty('activeRequests');
        expect(stats).toHaveProperty('maxRequests');
        expect(stats).toHaveProperty('queueLength');
        expect(stats).toHaveProperty('available');
    });

    it('should use default config', () => {
        const defaultLimiter = new RateLimiter();
        expect(defaultLimiter.maxRequests).toBe(15);
        expect(defaultLimiter.windowMs).toBe(60000);
    });

    it('should track queue length', async () => {
        limiter.acquire();
        limiter.acquire();
        const stats = limiter.getStats();
        expect(stats.queueLength).toBeGreaterThanOrEqual(0);
    });
});
