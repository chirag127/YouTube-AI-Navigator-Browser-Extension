import { l } from '../../utils/shortcuts/log.js';
import { now as nt } from '../../utils/shortcuts/core.js';

const metrics = new Map();

export class APIMetrics {
  static recordCall(apiName, duration, success, error = null) {
    if (!metrics.has(apiName)) {
      metrics.set(apiName, {
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastCall: null,
        errors: [],
      });
    }
    const m = metrics.get(apiName);
    m.totalCalls++;
    m.totalDuration += duration;
    m.avgDuration = m.totalDuration / m.totalCalls;
    m.lastCall = nt();
    if (success) {
      m.successCalls++;
    } else {
      m.failedCalls++;
      if (error) m.errors.push({ time: nt(), error: error.message || String(error) });
      if (m.errors.length > 10) m.errors.shift();
    }
  }

  static getStats(apiName) {
    if (!metrics.has(apiName)) {
      return {
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        avgDuration: 0,
        successRate: 0,
        lastCall: null,
      };
    }
    const m = metrics.get(apiName);
    return {
      totalCalls: m.totalCalls,
      successCalls: m.successCalls,
      failedCalls: m.failedCalls,
      avgDuration: Math.round(m.avgDuration),
      successRate: m.totalCalls > 0 ? (m.successCalls / m.totalCalls) * 100 : 0,
      lastCall: m.lastCall,
      recentErrors: m.errors.slice(-3),
    };
  }

  static shouldUseAPI(apiName, thresholds = {}) {
    const { minSuccessRate = 50, maxAvgDuration = 5000 } = thresholds;
    const stats = this.getStats(apiName);
    if (stats.totalCalls < 3) return true;
    const meetsSuccessRate = stats.successRate >= minSuccessRate;
    const meetsDuration = stats.avgDuration <= maxAvgDuration;
    const shouldUse = meetsSuccessRate && meetsDuration;
    if (!shouldUse) {
      l(
        `[APIMetrics] ${apiName} fails criteria: success=${stats.successRate.toFixed(1)}% (min ${minSuccessRate}%), avg=${stats.avgDuration}ms (max ${maxAvgDuration}ms)`
      );
    }
    return shouldUse;
  }

  static getAllStats() {
    const all = {};
    metrics.forEach((m, apiName) => {
      all[apiName] = this.getStats(apiName);
    });
    return all;
  }

  static reset(apiName) {
    if (apiName) {
      metrics.delete(apiName);
    } else {
      metrics.clear();
    }
  }
}
