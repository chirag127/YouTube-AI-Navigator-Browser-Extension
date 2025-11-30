import { videoCache as vc } from '../cache/video-cache.js';
import { msg } from '../../utils/shortcuts/runtime.js';

class VideoDataService {
  constructor() {
    this.p = new Map();
  }
  async getMetadata(id, o = {}) {
    const result = await this._f(id, 'metadata', async () => {
      const r = await msg({
        action: 'GET_VIDEO_DATA',
        videoId: id,
        dataType: 'metadata',
        options: o,
      });
      if (!r.success) throw new Error(r.error);
      return r.data;
    });
    return result;
  }
  async getTranscript(id, lg = 'en') {
    const result = await this._f(id, 'transcript', async () => {
      const r = await msg({
        action: 'GET_VIDEO_DATA',
        videoId: id,
        dataType: 'transcript',
        options: { lang: lg },
      });
      if (!r.success) throw new Error(r.error);
      return r.data;
    });
    return result;
  }
  async getComments(id, lm = 20) {
    const result = await this._f(id, 'comments', async () => {
      const r = await msg({
        action: 'GET_VIDEO_DATA',
        videoId: id,
        dataType: 'comments',
        options: { limit: lm },
      });
      if (!r.success) throw new Error(r.error);
      return r.data;
    });
    return result;
  }
  async _f(id, t, fn) {
    const c = await vc.get(id, t);
    if (c) {
      return c;
    }
    const k = `${id}:${t}`;
    if (this.p.has(k)) {
      return this.p.get(k);
    }
    const p = fn()
      .then(async d => {
        await vc.set(id, t, d);
        this.p.delete(k);
        return d;
      })
      .catch(e => {
        this.p.delete(k);
        throw e;
      });
    this.p.set(k, p);
    return p;
  }
  clearCache(id) {
    const result = vc.clear(id);
    return result;
  }
}
export const videoDataService = new VideoDataService();
