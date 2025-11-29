import { qs as i, on } from '../../utils/shortcuts/dom.js';
import { slcc as lcl } from '../../utils/shortcuts/storage.js';
export class CacheSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const c = this.s.get().cache || {};
    this.chk('cacheEnabled', c.enabled ?? true);
    this.set('cacheTTL', (c.ttl || 86400000) / 3600000);
    this.set('cacheMaxSize', c.maxSize || 50);
    this.chk('cacheTranscripts', c.transcripts ?? true);
    this.chk('cacheComments', c.comments ?? true);
    this.chk('cacheMetadata', c.metadata ?? true);
    this.chk('cacheSegments', c.segments ?? true);
    this.chk('cacheSummaries', c.summaries ?? true);
    this.a.attachToAll({
      cacheEnabled: { path: 'cache.enabled' },
      cacheTTL: { path: 'cache.ttl', transform: v => parseInt(v) * 3600000 },
      cacheMaxSize: { path: 'cache.maxSize', transform: v => parseInt(v) },
      cacheTranscripts: { path: 'cache.transcripts' },
      cacheComments: { path: 'cache.comments' },
      cacheMetadata: { path: 'cache.metadata' },
      cacheSegments: { path: 'cache.segments' },
      cacheSummaries: { path: 'cache.summaries' },
    });
    const cc = i('#clearCache');
    if (cc)
      on(cc, 'click', async () => {
        if (confirm('Clear all cached data? This cannot be undone.')) {
          await lcl();
          this.a.notifications?.success('Cache cleared');
        }
      });
    const vs = i('#viewCacheStats');
    if (vs)
      on(vs, 'click', async () => {
        const s = await chrome.storage.local.getBytesInUse();
        const d = i('#cacheStats');
        if (d) {
          d.className = 'status-indicator success';
          d.textContent = `Cache: ${(s / 1024 / 1024).toFixed(2)} MB`;
        }
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
