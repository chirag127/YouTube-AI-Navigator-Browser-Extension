import { url } from '../../utils/shortcuts/runtime.js';
import { $ } from '../../utils/shortcuts/dom.js';
import { l, e as ce2 } from '../../utils/shortcuts/log.js';
import { pa } from '../../utils/shortcuts/async.js';
import { ok } from '../../utils/shortcuts/core.js';
import { ft } from '../../utils/shortcuts/network.js';

export class TabLoader {
  constructor() {
    this.tabs = {
      general: 'sections/general.html',
      cache: 'sections/cache.html',
      transcript: 'sections/transcript.html',
      comments: 'sections/comments.html',
      metadata: 'sections/metadata.html',
      scroll: 'sections/scroll.html',
      performance: 'sections/performance.html',
      notifications: 'sections/notifications.html',
    };
    this.loaded = new Set();
  }
  async load(id) {
    if (this.loaded.has(id)) return true;
    const p = this.tabs[id];
    if (!p) return false;
    try {
      const h = await ft(url(`options/${p}`)).then(r => r.text());
      const c = $('.content-area');
      c.insertAdjacentHTML('beforeend', h);
      this.loaded.add(id);
      l(`[TabLoader] Loaded ${id}`);
      return true;
    } catch (x) {
      ce2(`[TabLoader] Failed to load ${id}:`, x);
      return false;
    }
  }
  async loadAll() {
    await pa(ok(this.tabs).map(id => this.load(id)));
  }
}
