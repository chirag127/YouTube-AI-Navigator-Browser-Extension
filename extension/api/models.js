import { w } from '../utils/shortcuts/log.js';
import { jf as fj } from '../utils/shortcuts/network.js';
import { fl, mp } from '../utils/shortcuts/array.js';
import { rp } from '../utils/shortcuts/string.js';

export class ModelManager {
  constructor(apiKey, baseUrl) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.models = [];
  }
  async fetch() {
    if (!this.apiKey) return;
    try {
      const data = await fj(`${this.baseUrl}/models?key=${this.apiKey}`);
      if (data?.models)
        this.models = mp(
          fl(data.models, m => m.supportedGenerationMethods?.includes('generateContent')),
          m => rp(m.name, 'models/', '')
        );
    } catch (e) {
      w('Mod fetch fail:', e);
      this.models = [];
    }
    return this.models;
  }
  getList() {
    const p = [
      'gemini-2.5-flash-lite-preview-09-2025',
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash-preview-09-2025',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro-001',
    ];
    const s = [...this.models].sort((a, b) => {
      const ia = p.indexOf(a),
        ib = p.indexOf(b);
      if (ia > -1 && ib > -1) return ia - ib;
      if (ia > -1) return -1;
      if (ib > -1) return 1;
      return a.localeCompare(b);
    });
    return s.length ? s : p;
  }
}
