import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIMetrics } from '../../../extension/api/core/api-metrics.js';

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
    l: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/core.js', () => ({
    now: vi.fn(() => Date.now()),
}));

describe('APIMetrics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        APIMetrics.reset();
    });

    describe('recordCall', () => {
        it('should record successful call', () => {
            APIMetrics.recordCall('testAPI', 100, true);

            const stats = APIMetrics.getStats('testAPI');

            expect(stats.totalCalls).toBe(1);
            expect(stats.successCalls).toBe(1);
            expect(stats.failedCalls).toBe(0);
            expect(stats.avgDuration).toBe(100);
        });

        it('should record failed call', () => {
            const error = new Error('test error');
            APIMetrics.recordCall('testAPI', 200, false, error);

            const stats = APIMetrics.getStats('testAPI');

            expect(stats.totalCalls).toBe(1);
            expect(stats.successCalls).toBe(0);
            expect(stats.failedCalls).toBe(1);
            expect(stats.recentErrors).toHaveLength(1);
        });

        it('should maintain error history limit', () => {
            for (let i = 0; i < 12; i++) {
                APIMetrics.recordCall('testAPI', 100, false, new Error(`error${i}`));
            }

            const stats = APIMetrics.getStats('testAPI');

            expect(stats.recentErrors).toHaveLength(3);
        });
    });

    describe('getStats', () => {
        it('should return default stats for unknown API', () => {
            const stats = APIMetrics.getStats('unknown');

            expect(stats.totalCalls).toBe(0);
            expect(stats.successRate).toBe(0);
        });

        it('should calculate success rate', () => {
            APIMetrics.recordCall('testAPI', 100, true);
            APIMetrics.recordCall('testAPI', 100, false);

            const stats = APIMetrics.getStats('testAPI');

            expect(stats.successRate).toBe(50);
        });
    });

    describe('shouldUseAPI', () => {
        it('should return true for new API', () => {
            const result = APIMetrics.shouldUseAPI('newAPI');

            expect(result).toBe(true);
        });

        it('should return true when criteria met', () => {
            for (let i = 0; i < 5; i++) {
                APIMetrics.recordCall('testAPI', 100, true);
            }

            const result = APIMetrics.shouldUseAPI('testAPI');

            expect(result).toBe(true);
        });

        it('should return false when success rate too low', () => {
            for (let i = 0; i < 5; i++) {
                APIMetrics.recordCall('testAPI', 100, false);
            }

            const result = APIMetrics.shouldUseAPI('testAPI', { minSuccessRate: 80 });

            expect(result).toBe(false);
        });

        it('should return false when avg duration too high', () => {
            for (let i = 0; i < 5; i++) {
                APIMetrics.recordCall('testAPI', 6000, true);
            }

            const result = APIMetrics.shouldUseAPI('testAPI', { maxAvgDuration: 5000 });

            expect(result).toBe(false);
        });
    });

    describe('getAllStats', () => {
        it('should return stats for all APIs', () => {
            APIMetrics.recordCall('api1', 100, true);
            APIMetrics.recordCall('api2', 200, false);

            const allStats = APIMetrics.getAllStats();

            expect(allStats).toHaveProperty('api1');
            expect(allStats).toHaveProperty('api2');
        });
    });

    describe('reset', () => {
        it('should reset specific API', () => {
            APIMetrics.recordCall('testAPI', 100, true);

            APIMetrics.reset('testAPI');

            const stats = APIMetrics.getStats('testAPI');
            expect(stats.totalCalls).toBe(0);
        });

        it('should reset all APIs', () => {
            APIMetrics.recordCall('api1', 100, true);
            APIMetrics.recordCall('api2', 100, true);

            APIMetrics.reset();

            expect(APIMetrics.getAllStats()).toEqual({});
        });
    });
});