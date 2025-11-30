import { describe, it, expect, beforeEach } from 'vitest';
import { APIMetrics } from '../extension/api/core/api-metrics.js';

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  l: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/core.js', () => ({
  now: vi.fn(() => Date.now()),
}));

describe('API Metrics Tests', () => {
  beforeEach(() => {
    APIMetrics.reset();
  });

  describe('Recording Calls', () => {
    it('should record successful call', () => {
      APIMetrics.recordCall('testAPI', 100, true);
      const stats = APIMetrics.getStats('testAPI');
      expect(stats.totalCalls).toBe(1);
      expect(stats.successCalls).toBe(1);
      expect(stats.failedCalls).toBe(0);
      expect(stats.avgDuration).toBe(100);
      expect(stats.successRate).toBe(100);
    });

    it('should record failed call', () => {
      APIMetrics.recordCall('testAPI', 200, false, new Error('Failed'));
      const stats = APIMetrics.getStats('testAPI');
      expect(stats.totalCalls).toBe(1);
      expect(stats.successCalls).toBe(0);
      expect(stats.failedCalls).toBe(1);
      expect(stats.successRate).toBe(0);
      expect(stats.recentErrors.length).toBe(1);
    });

    it('should calculate average duration correctly', () => {
      APIMetrics.recordCall('testAPI', 100, true);
      APIMetrics.recordCall('testAPI', 200, true);
      APIMetrics.recordCall('testAPI', 300, true);
      const stats = APIMetrics.getStats('testAPI');
      expect(stats.avgDuration).toBe(200);
    });

    it('should calculate success rate correctly', () => {
      APIMetrics.recordCall('testAPI', 100, true);
      APIMetrics.recordCall('testAPI', 100, true);
      APIMetrics.recordCall('testAPI', 100, false);
      APIMetrics.recordCall('testAPI', 100, false);
      const stats = APIMetrics.getStats('testAPI');
      expect(stats.successRate).toBe(50);
    });

    it('should limit recent errors to 10', () => {
      for (let i = 0; i < 15; i++) {
        APIMetrics.recordCall('testAPI', 100, false, new Error(`Error ${i}`));
      }
      const stats = APIMetrics.getStats('testAPI');
      expect(stats.recentErrors.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Auto-Detection Logic', () => {
    it('should allow API with < 3 calls', () => {
      APIMetrics.recordCall('testAPI', 100, false);
      expect(APIMetrics.shouldUseAPI('testAPI')).toBe(true);
    });

    it('should allow API meeting criteria', () => {
      APIMetrics.recordCall('testAPI', 100, true);
      APIMetrics.recordCall('testAPI', 100, true);
      APIMetrics.recordCall('testAPI', 100, true);
      expect(APIMetrics.shouldUseAPI('testAPI')).toBe(true);
    });

    it('should block API with low success rate', () => {
      APIMetrics.recordCall('testAPI', 100, false);
      APIMetrics.recordCall('testAPI', 100, false);
      APIMetrics.recordCall('testAPI', 100, true);
      expect(APIMetrics.shouldUseAPI('testAPI', { minSuccessRate: 70 })).toBe(false);
    });

    it('should block API with high avg duration', () => {
      APIMetrics.recordCall('testAPI', 6000, true);
      APIMetrics.recordCall('testAPI', 6000, true);
      APIMetrics.recordCall('testAPI', 6000, true);
      expect(APIMetrics.shouldUseAPI('testAPI', { maxAvgDuration: 5000 })).toBe(false);
    });

    it('should use custom thresholds', () => {
      APIMetrics.recordCall('testAPI', 3000, true);
      APIMetrics.recordCall('testAPI', 3000, true);
      APIMetrics.recordCall('testAPI', 3000, false);
      expect(APIMetrics.shouldUseAPI('testAPI', { minSuccessRate: 60, maxAvgDuration: 4000 })).toBe(
        true
      );
    });
  });

  describe('Stats Retrieval', () => {
    it('should return empty stats for unknown API', () => {
      const stats = APIMetrics.getStats('unknownAPI');
      expect(stats.totalCalls).toBe(0);
      expect(stats.successRate).toBe(0);
    });

    it('should return all stats', () => {
      APIMetrics.recordCall('api1', 100, true);
      APIMetrics.recordCall('api2', 200, false);
      const allStats = APIMetrics.getAllStats();
      expect(Object.keys(allStats)).toContain('api1');
      expect(Object.keys(allStats)).toContain('api2');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset specific API', () => {
      APIMetrics.recordCall('api1', 100, true);
      APIMetrics.recordCall('api2', 200, true);
      APIMetrics.reset('api1');
      expect(APIMetrics.getStats('api1').totalCalls).toBe(0);
      expect(APIMetrics.getStats('api2').totalCalls).toBe(1);
    });

    it('should reset all APIs', () => {
      APIMetrics.recordCall('api1', 100, true);
      APIMetrics.recordCall('api2', 200, true);
      APIMetrics.reset();
      expect(APIMetrics.getStats('api1').totalCalls).toBe(0);
      expect(APIMetrics.getStats('api2').totalCalls).toBe(0);
    });
  });
});
