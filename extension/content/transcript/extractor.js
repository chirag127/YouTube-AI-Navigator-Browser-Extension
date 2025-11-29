import { fetchTranscript } from '../../services/transcript/fetcher.js';
import { l, e } from '../../utils/shortcuts/log.js';
import { cw } from '../../utils/shortcuts/windows.js';
import { jp } from '../../utils/shortcuts/core.js';
import { st } from '../../utils/shortcuts/time.js';
import { on, qsa as $$ } from '../../utils/shortcuts/dom.js';

class TranscriptExtractor {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000;
    this.interceptedTranscripts = new Map();
    on(window, 'message', ev => {
      if (ev.source !== window) return;
      if (ev.data.type === 'YT_TRANSCRIPT') this.handleInterceptedTranscript(ev.data.payload);
    });
  }

  handleInterceptedTranscript() {
    try {
      this.log('info', 'Intercepted transcript data from Main World');
    } catch (x) {
      e('Error handling intercepted transcript:', x);
    }
  }

  log(lvl, msg) {
    const i = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
    const f = lvl === 'error' ? e : lvl === 'warn' ? cw : l;
    f(`[TranscriptExtractor] ${i[lvl] || ''} ${msg}`);
  }

  async extract(vid, { lang = 'en', useCache = true, timeout = 30000 } = {}) {
    this.log('info', `Extracting: ${vid}, lang: ${lang}`);
    if (useCache) {
      const c = this._getCache(vid, lang);
      if (c) {
        this.log('success', 'Cache hit');
        return c;
      }
    }
    try {
      const r = await fetchTranscript(vid, lang, timeout);
      if (r?.length) {
        this.log('success', `${r.length} segments extracted`);
        this._setCache(vid, lang, r);
        return r;
      }
      throw new Error('Empty result from fetcher');
    } catch (x) {
      this.log('error', x.message);
      throw x;
    }
  }

  getAvailableTracks() {
    const pr = getPlayerResponse();
    return pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  }
  getAvailableLanguages() {
    return this.getAvailableTracks().map(t => ({
      code: t.languageCode,
      name: t.name?.simpleText || t.languageCode,
      kind: t.kind,
    }));
  }
  hasCaptions() {
    return this.getAvailableTracks().length > 0;
  }
  formatWithTimestamps(s) {
    return s.map(x => `[${formatTime(x.start)}] ${x.text}`).join('\n');
  }
  formatPlainText(s) {
    return s.map(x => x.text).join(' ');
  }
  _getCache(vid, lang) {
    const c = this.cache.get(`${vid}_${lang}`);
    return c && Date.now() - c.ts < this.cacheTimeout ? c.data : null;
  }
  _setCache(vid, lang, d) {
    this.cache.set(`${vid}_${lang}`, { data: d, ts: Date.now() });
  }
  clearCache() {
    this.cache.clear();
    this.log('info', 'Cache cleared');
  }

  async getInitialData() {
    return new Promise(r => {
      const lis = ev => {
        if (ev.source !== window) return;
        if (ev.data.type === 'YT_DATA_RESPONSE') {
          window.removeEventListener('message', lis);
          r(ev.data.payload);
        }
      };
      on(window, 'message', lis);
      window.postMessage({ type: 'YT_GET_DATA' }, '*');
      st(() => {
        window.removeEventListener('message', lis);
        r(null);
      }, 1000);
    });
  }
}

function getPlayerResponse() {
  for (const s of $$('script')) {
    const m = s.textContent?.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (m) {
      try {
        return jp(m[1]);
      } catch (e) {
        continue;
      }
    }
  }
  return null;
}

function formatTime(sec) {
  const h = Math.floor(sec / 3600),
    m = Math.floor((sec % 3600) / 60),
    s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`;
}

export default new TranscriptExtractor();
export { TranscriptExtractor };
