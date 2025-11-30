import { GeminiClient } from './gemini-client.js';
import { ModelManager } from './models.js';
import { prompts } from './prompts/index.js';
import {
  extractSection,
  extractTimestamps,
  parseSegmentsJSON,
  expandLabel,
  transformSegments,
} from './utils/response-parser.js';
import { w, e } from '../utils/shortcuts/log.js';

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
    const ctx = {
      transcript: c,
      metadata: md || {},
      comments: [],
      lyrics: null,
      sponsorBlockSegments: md?.sponsorBlockSegments || [],
    };
    const prompt = await prompts.chat(q, ctx);
    return this.generateContent(prompt, m);
  }

  async analyzeCommentSentiment(c, m = null) {
    if (!c || !c.length) {
      w('[GS] No comms');
      return 'No comments available to analyze.';
    }
    const prompt = await prompts.comments(c);
    return this.generateContent(prompt, m);
  }

  async generateComprehensiveAnalysis(ctx, opt = {}) {
    try {
      const prompt = await prompts.comprehensive(ctx, opt);
      const r = await this.generateContent(prompt);
      const s = extractSection(r, 'Summary');
      const i = extractSection(r, 'Key Insights');
      const f = extractSection(r, 'FAQ');
      const ts = extractTimestamps(s);
      return {
        summary: s || r,
        insights: i || '',
        faq: f || '',
        timestamps: ts,
      };
    } catch (x) {
      e('error:generateComprehensiveAnalysis fail:', x);
      throw x;
    }
  }

  async extractSegments(ctx) {
    try {
      const prompt = await prompts.segments(ctx);
      const r = await this.generateContent(prompt);
      const parsed = parseSegmentsJSON(r);
      if (!parsed) {
        return { segments: [], fullVideoLabel: null };
      }
      const ts = transformSegments(parsed, expandLabel);
      return {
        segments: ts,
        fullVideoLabel: expandLabel(parsed.fullVideoLabel) || null,
      };
    } catch (x) {
      e('error:extractSegments fail:', x.message);
      e('[GS] Stack:', x.stack);
      return { segments: [], fullVideoLabel: null };
    }
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
        const res = await this.client.generateContent(p, mn);
        return res;
      } catch (x) {
        errs.push({ model: mn, error: x.message });
        w(`[GS] ${mn} fail:`, x.message);
        if (x.retryable === false) {
          throw x;
        }
      }
    }
    const em = `All ${ml.length} failed. ${errs[0]?.error || 'Unknown'}`;
    e('error:generateContent all failed:', em);
    throw new Error(em);
  }

  getRateLimitStats() {
    return this.client.getRateLimitStats();
  }
}
