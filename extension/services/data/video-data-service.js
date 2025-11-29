import { videoCache as vc } from '../cache/video-cache.js';
import { msg } from '../../utils/shortcuts/runtime.js';
import { l } from '../../utils/shortcuts/log.js';

class VideoDataService {
  constructor() {
    this.p = new Map();
  }
  async getMetadata(id, o = {}) {
    l('ENTRY:VideoDataService.getMetadata');
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
    l('EXIT:VideoDataService.getMetadata');
    return result;
  }
  async getTranscript(id, lg = 'en') {
    l('ENTRY:VideoDataService.getTranscript');
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
    l('EXIT:VideoDataService.getTranscript');
    return result;
  }
  async getComments(id, lm = 20) {
    l('ENTRY:VideoDataService.getComments');
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
    l('EXIT:VideoDataService.getComments');
    return result;
  }
  async _f(id, t, fn) {
    l('ENTRY:VideoDataService._f');
    const c = await vc.get(id, t);
    if (c) {
      l('EXIT:VideoDataService._f');
      return c;
    }
    const k = `${id}:${t}`;
    if (this.p.has(k)) {
      l(`[VideoDataService] Waiting for pending: ${k}`);
      l('EXIT:VideoDataService._f');
      return this.p.get(k);
    }
    const p = fn()
      .then(async d => {
        await vc.set(id, t, d);
        this.p.delete(k);
        l('EXIT:VideoDataService._f');
        return d;
      })
      .catch(e => {
        this.p.delete(k);
        l('EXIT:VideoDataService._f');
        throw e;
      });
    this.p.set(k, p);
    return p;
  }
  clearCache(id) {
    l('ENTRY:VideoDataService.clearCache');
    const result = vc.clear(id);
    l('EXIT:VideoDataService.clearCache');
    return result;
  }
}
export const videoDataService = new VideoDataService();
