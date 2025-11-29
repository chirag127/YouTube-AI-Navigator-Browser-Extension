import { GeminiClient } from './gemini-client.js';
import { ModelManager } from './models.js';
import { prompts } from './prompts/index.js';
import { l, w, e } from '../utils/shortcuts/log.js';
import { jp, js } from '../utils/shortcuts/core.js';
import { sb as sub, trm, rp as rep } from '../utils/shortcuts/string.js';
import { isa } from '../utils/shortcuts/array.js';
import { mp } from '../utils/shortcuts/core.js';

export { ModelManager };

export class GeminiService {
  constructor(apiKey) {
    this.client = new GeminiClient(apiKey);
    this.models = new ModelManager(apiKey, 'https://generativelanguage.googleapis.com/v1beta');
  }
  async fetchAvailableModels() {
    return this.models.fetch();
  }
  async chatWithVideo(q, c, m = null, md = null) {
    return this.generateContent(prompts.chat(q, c, md), m);
  }
  async analyzeCommentSentiment(c, m = null) {
    l('[GS] ACS:', c?.length);
    if (!c || !c.length) {
      w('[GS] No comms');
      return 'No comments available to analyze.';
    }
    l(`[GS] Gen anal for ${c.length}`);
    return this.generateContent(prompts.comments(c), m);
  }
  async generateComprehensiveAnalysis(ctx, opt = {}) {
    try {
      const r = await this.generateContent(prompts.comprehensive(ctx, opt));
      const s = this._extractSection(r, 'Summary');
      const i = this._extractSection(r, 'Key Insights');
      const f = this._extractSection(r, 'FAQ');
      return {
        summary: s || r,
        insights: i || '',
        faq: f || '',
        timestamps: [],
      };
    } catch (x) {
      e('[GS] Anal fail:', x);
      throw x;
    }
  }
  async extractSegments(ctx) {
    try {
      l('[GS] Ext segs');
      const r = await this.generateContent(prompts.segments(ctx));
      l('[GS] Raw len:', r.length);
      l('[GS] 1st 1k:', sub(r, 0, 1000));
      let cr = trm(r);
      cr = rep(cr, /```json\s*/g, '');
      cr = rep(cr, /```\s*/g, '');
      cr = trm(cr);
      let jm = cr.match(/\{[\s\S]*\}/);
      if (!jm) {
        e('[GS] No JSON:', r);
        return { segments: [], fullVideoLabel: null };
      }
      const jsStr = jm[0];
      l('[GS] JSON len:', jsStr.length);
      const p = jp(jsStr);
      if (!p.segments || !isa(p.segments)) {
        e('[GS] Inv struct:', p);
        return { segments: [], fullVideoLabel: null };
      }
      l('[GS] Parsed:', p.segments.length);
      l('[GS] FVL:', p.fullVideoLabel);
      const ts = mp(p.segments, s => ({
        start: s.s,
        end: s.e,
        label: this._expandLabel(s.l),
        title: s.t,
        description: s.d,
        text: s.d,
      }));
      if (ts.length > 0) l('[GS] 1st seg:', js(ts[0]));
      return {
        segments: ts,
        fullVideoLabel: this._expandLabel(p.fullVideoLabel) || null,
      };
    } catch (x) {
      e('[GS] Seg fail:', x.message);
      e('[GS] Stack:', x.stack);
      return { segments: [], fullVideoLabel: null };
    }
  }
  _extractSection(t, sn) {
    const r = new RegExp(`## ${sn}\\s*([\\s\\S]*?)(?=##|$)`, 'i');
    const m = t.match(r);
    return m ? trm(m[1]) : null;
  }
  _expandLabel(sc) {
    if (!sc) return null;
    const lm = {
      S: 'Sponsor',
      SP: 'Self Promotion',
      UP: 'Unpaid Promotion',
      EA: 'Exclusive Access',
      IR: 'Interaction Reminder (Subscribe)',
      H: 'Highlight',
      I: 'Intermission/Intro Animation',
      EC: 'Endcards/Credits',
      P: 'Preview/Recap',
      G: 'Hook/Greetings',
      T: 'Tangents/Jokes',
      NM: 'Music: Non-Music Section',
      C: 'Content',
    };
    return lm[sc] || sc;
  }
  async generateContent(p, m = null) {
    let ml = [];
    const fm = [
      'gemini-2.5-flash-lite-preview-09-2025',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash-preview-09-2025',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro-002',
    ];
    if (m) ml = [m];
    else {
      if (this.models.models.length === 0) {
        try {
          await this.models.fetch();
        } catch (x) {
          w('Mod fetch fail:', x.message);
          ml = fm;
        }
      }
      if (this.models.models.length > 0) ml = this.models.getList();
      else if (ml.length === 0) ml = fm;
    }
    const errs = [];
    for (let i = 0; i < ml.length; i++) {
      const mn = ml[i];
      try {
        l(`[GS] Try: ${mn} (${i + 1}/${ml.length})`);
        const res = await this.client.generateContent(p, mn);
        if (i > 0) l(`[GS] Fallback succ: ${mn}`);
        return res;
      } catch (x) {
        errs.push({ model: mn, error: x.message });
        w(`[GS] ${mn} fail:`, x.message);
        if (x.retryable === false) throw x;
        if (i < ml.length - 1) l('[GS] Next...');
      }
    }
    const em = `All ${ml.length} failed. ${errs[0]?.error || 'Unknown'}`;
    e('[GS]', em);
    throw new Error(em);
  }
  getRateLimitStats() {
    return this.client.getRateLimitStats();
  }
}
