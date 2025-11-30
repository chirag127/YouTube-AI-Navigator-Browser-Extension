import { qs as i } from '../../utils/shortcuts/dom.js';
import { pi } from '../../utils/shortcuts/global.js';
export class PerformanceSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    this.loadSettings();
    this.attachListeners();
  }
  loadSettings() {
    const c = this.s.get(),
      p = c.performance || {};
    this.set('section-maxConcurrentRequests', p.maxConcurrentRequests || 3);
    this.set('section-rateLimitDelay', p.rateLimitDelay || 1000);
    this.set('section-retryAttempts', p.retryAttempts || 3);
    this.set('section-retryDelay', p.retryDelay || 2000);
    this.chk('enableCompression', p.enableCompression ?? true);
    this.chk('lazyLoad', p.lazyLoad ?? true);
    this.chk('prefetchData', p.prefetchData ?? true);
  }
  attachListeners() {
    this.a.attachToAll({
      maxConcurrentRequests: {
        path: 'performance.maxConcurrentRequests',
        selector: '#section-maxConcurrentRequests',
        transform: v => pi(v),
      },
      rateLimitDelay: {
        path: 'performance.rateLimitDelay',
        selector: '#section-rateLimitDelay',
        transform: v => pi(v),
      },
      retryAttempts: {
        path: 'performance.retryAttempts',
        selector: '#section-retryAttempts',
        transform: v => pi(v),
      },
      retryDelay: {
        path: 'performance.retryDelay',
        selector: '#section-retryDelay',
        transform: v => pi(v),
      },
      enableCompression: { path: 'performance.enableCompression' },
      lazyLoad: { path: 'performance.lazyLoad' },
      prefetchData: { path: 'performance.prefetchData' },
    });
  }
  set(id, v) {
    const el = i(`#${id}`);
    if (el) el.value = v;
  }
  chk(id, v) {
    const el = i(`#${id}`);
    if (el) el.checked = v;
  }
}
