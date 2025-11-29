import { l, e } from '../../utils/shortcuts/log.js';
import { afl, afn, aus, aic as inc, isa } from '../../utils/shortcuts/array.js';
import { nw as nt } from '../../utils/shortcuts/core.js';
import { js, jp } from '../../utils/shortcuts/global.js';
import { lc } from '../../utils/shortcuts/string.js';
import { sl, slc } from '../../utils/shortcuts/storage.js';
export class ComprehensiveHistory {
  constructor() {
    this.k = 'comprehensive_history';
    this.m = 100;
  }
  async save(v, d) {
    const n = {
      videoId: v,
      timestamp: nt(),
      url: `https://www.youtube.com/watch?v=${v}`,
      metadata: d.metadata || {},
      transcript: d.transcript || [],
      comments: { raw: d.comments || [], analysis: d.commentAnalysis || null },
      segments: { detected: d.segments || [], actions: d.segmentActions || {} },
      analysis: {
        summary: d.summary || null,
        comprehensive: d.comprehensiveReview || null,
        faq: d.faq || null,
        keyPoints: d.keyPoints || [],
      },
      chatHistory: d.chatHistory || [],
      userActions: {
        liked: d.liked || false,
        watched: d.watchPercentage || 0,
        skippedSegments: d.skippedSegments || [],
      },
    };
    const h = await this.getAll(),
      f = afl(h, x => x.videoId !== v);
    aus(f, n);
    const t = slc(f, 0, this.m);
    await sl({ [this.k]: t });
    l(`[History] Saved comprehensive data for ${v}`);
    return n;
  }
  async get(v) {
    const h = await this.getAll();
    return afn(h, x => x.videoId === v);
  }
  async getAll() {
    const r = await sl(this.k);
    return r[this.k] || [];
  }
  async delete(v) {
    const h = await this.getAll(),
      f = afl(h, x => x.videoId !== v);
    await sl({ [this.k]: f });
  }
  async clear() {
    await sl(this.k, null);
  }
  async search(q) {
    const h = await this.getAll(),
      lq = lc(q);
    return afl(
      h,
      e =>
        (e.metadata?.title && inc(lc(e.metadata.title), lq)) ||
        (e.metadata?.author && inc(lc(e.metadata.author), lq)) ||
        inc(e.videoId, lq)
    );
  }
  async getStats() {
    const h = await this.getAll();
    return {
      totalVideos: h.length,
      totalTranscripts: afl(h, x => x.transcript?.length > 0).length,
      totalComments: afl(h, x => x.comments?.raw?.length > 0).length,
      totalSegments: afl(h, x => x.segments?.detected?.length > 0).length,
      totalAnalyses: afl(h, x => x.analysis?.summary).length,
      storageSize: js(h).length,
    };
  }
  async export() {
    const h = await this.getAll();
    return js(h, null, 2);
  }
  async import(j) {
    try {
      const i = jp(j);
      if (!isa(i)) throw new Error('Invalid format');
      await sl({ [this.k]: i });
      return true;
    } catch (x) {
      e('[History] Import failed:', x);
      return false;
    }
  }
}
let i = null;
export function getHistory() {
  if (!i) i = new ComprehensiveHistory();
  return i;
}
