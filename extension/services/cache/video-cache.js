import { sl } from '../../utils/shortcuts/storage.js';
import { l } from '../../utils/shortcuts/log.js';
import { nw as nt, ok as keys } from '../../utils/shortcuts/core.js';

const V = 1,
  E = 86400000;
class VideoCache {
  constructor() {
    this.m = new Map();
  }
  async get(id, t) {
    const k = `${id}:${t}`;
    if (this.m.has(k)) {
      const c = this.m.get(k);
      if (nt() - c.ts < E) {
        l(`[VideoCache] Memory hit: ${k}`);
        return c.d;
      }
      this.m.delete(k);
    }
    const sk = `video_${id}_${t}`,
      r = await sl(sk);
    if (r[sk]) {
      const c = r[sk];
      if (c.v === V && nt() - c.ts < E) {
        l(`[VideoCache] Storage hit: ${sk}`);
        this.m.set(k, { d: c.d, ts: c.ts });
        return c.d;
      }
      await sl(sk, null);
    }
    return null;
  }
  async set(id, t, d) {
    const k = `${id}:${t}`,
      sk = `video_${id}_${t}`,
      ts = nt();
    this.m.set(k, { d, ts });
    await sl({ [sk]: { v: V, ts, d } });
    l(`[VideoCache] Cached: ${sk}`);
  }
  async clear(id) {
    if (id) {
      const ks = ['metadata', 'transcript', 'comments'];
      for (const t of ks) {
        this.m.delete(`${id}:${t}`);
        await sl(`video_${id}_${t}`, null);
      }
    } else {
      this.m.clear();
      const a = await sl(null),
        vk = keys(a).filter(k => k.startsWith('video_'));
      await sl(vk, null);
    }
  }
}
export const videoCache = new VideoCache();
