import deArrowAPI from '../../api/dearrow.js';
import { l, e } from '../../utils/shortcuts/log.js';
import { cw } from '../../utils/shortcuts/windows.js';
import { jp } from '../../utils/shortcuts/core.js';
import { st } from '../../utils/shortcuts/time.js';
import { on, qs as $ } from '../../utils/shortcuts/dom.js';

class MetadataExtractor {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000;
  }

  log(lvl, msg) {
    const i = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
    const f = lvl === 'error' ? e : lvl === 'warn' ? cw : l;
    f(`[MetadataExtractor] ${i[lvl]} ${msg}`);
  }

  async extract(vid, opt = {}) {
    const { useDeArrow = true, usePrivateDeArrow = true } = opt;
    this.log('info', `Extracting metadata for: ${vid}`);
    const c = this._getCache(vid);
    if (c) {
      this.log('success', 'Cache hit');
      return c;
    }
    let md = null,
      da = null;
    if (useDeArrow) {
      try {
        this.log('info', 'Fetching DeArrow data...');
        da = await deArrowAPI.getVideoMetadata(vid, { usePrivateAPI: usePrivateDeArrow });
        if (da?.hasDeArrowData && da.title) this.log('success', `DeArrow title found: ${da.title}`);
      } catch (x) {
        this.log('warn', `DeArrow fetch failed: ${x.message}`);
      }
    }
    const id = await this.getInitialData();
    const pr = id?.playerResponse;
    try {
      const ot = this._extractTitle(pr);
      md = {
        videoId: vid,
        title: da?.title || ot,
        originalTitle: ot,
        deArrowTitle: da?.title || null,
        hasDeArrowTitle: !!da?.title,
        description: this._extractDescription(pr),
        author: this._extractAuthor(pr),
        viewCount: this._extractViewCount(pr),
        publishDate: this._extractPublishDate(pr),
        duration: this._extractDuration(pr),
        keywords: this._extractKeywords(pr),
        category: this._extractCategory(pr),
        deArrowThumbnail: da?.thumbnail || null,
      };
      if (md.title && md.title !== 'Unknown Title') {
        const src = md.hasDeArrowTitle ? 'DeArrow + DOM' : 'DOM';
        this.log('success', `Metadata extracted from ${src}: ${md.title}`);
        this._setCache(vid, md);
        return md;
      }
    } catch (x) {
      this.log('warn', `DOM extraction failed: ${x.message}`);
    }
    if (!md || !md.title || md.title === 'Unknown Title') {
      try {
        const jl = this._extractJsonLd();
        if (jl && jl.name) {
          md = {
            videoId: vid,
            title: da?.title || jl.name,
            originalTitle: jl.name,
            deArrowTitle: da?.title || null,
            hasDeArrowTitle: !!da?.title,
            description: jl.description || '',
            author: jl.author?.name || 'Unknown Channel',
            viewCount: jl.interactionStatistic?.userInteractionCount || 'Unknown',
            publishDate: jl.uploadDate || null,
            duration: null,
            keywords: [],
            category: jl.genre || null,
            deArrowThumbnail: da?.thumbnail || null,
          };
          const src = md.hasDeArrowTitle ? 'DeArrow + JSON-LD' : 'JSON-LD';
          this.log('success', `Metadata extracted from ${src}: ${md.title}`);
          this._setCache(vid, md);
          return md;
        }
      } catch (x) {
        this.log('warn', `JSON-LD extraction failed: ${x.message}`);
      }
    }
    if (!md || !md.title) {
      md = {
        videoId: vid,
        title: da?.title || 'Unknown Title',
        originalTitle: 'Unknown Title',
        deArrowTitle: da?.title || null,
        hasDeArrowTitle: !!da?.title,
        description: '',
        author: 'Unknown Channel',
        viewCount: 'Unknown',
        publishDate: null,
        duration: null,
        keywords: [],
        category: null,
        deArrowThumbnail: da?.thumbnail || null,
      };
    }
    this.log('success', `Metadata extracted: ${md.title}`);
    this._setCache(vid, md);
    return md;
  }

  _extractTitle(pr) {
    const m = [
      () => $('h1.ytd-watch-metadata yt-formatted-string')?.textContent,
      () => $('h1.title yt-formatted-string')?.textContent,
      () => $('meta[name="title"]')?.content,
      () => $('meta[property="og:title"]')?.content,
      () => document.title.replace(' - YouTube', ''),
      () => pr?.videoDetails?.title,
    ];
    for (const f of m) {
      try {
        const t = f();
        if (t?.trim()) return t.trim();
      } catch (e) {
        continue;
      }
    }
    return 'Unknown Title';
  }

  _extractDescription(pr) {
    const m = [
      () => {
        const b = $('tp-yt-paper-button#expand');
        if (b && !b.hasAttribute('hidden')) b.click();
        return $('ytd-text-inline-expander#description-inline-expander yt-attributed-string')
          ?.textContent;
      },
      () => $('#description yt-formatted-string')?.textContent,
      () => $('meta[name="description"]')?.content,
      () => $('meta[property="og:description"]')?.content,
      () => pr?.videoDetails?.shortDescription,
    ];
    for (const f of m) {
      try {
        const d = f();
        if (d?.trim()) return d.trim();
      } catch (e) {
        continue;
      }
    }
    return '';
  }

  _extractAuthor(pr) {
    const m = [
      () => $('ytd-channel-name#channel-name yt-formatted-string a')?.textContent,
      () => $('#owner-name a')?.textContent,
      () => $('link[itemprop="name"]')?.content,
      () => pr?.videoDetails?.author,
    ];
    for (const f of m) {
      try {
        const a = f();
        if (a?.trim()) return a.trim();
      } catch (e) {
        continue;
      }
    }
    return 'Unknown Channel';
  }

  _extractViewCount(pr) {
    const m = [
      () => this._parseViewCount($('ytd-video-view-count-renderer span.view-count')?.textContent),
      () => this._parseViewCount($('#info-container #count')?.textContent),
      () => pr?.videoDetails?.viewCount,
    ];
    for (const f of m) {
      try {
        const v = f();
        if (v) return v;
      } catch (e) {
        continue;
      }
    }
    return 'Unknown';
  }

  _parseViewCount(t) {
    if (!t) return null;
    const m = t.match(/[\d,]+/);
    return m ? m[0].replace(/,/g, '') : null;
  }

  _extractPublishDate(pr) {
    const m = [
      () => $('meta[itemprop="uploadDate"]')?.content,
      () => $('#info-strings yt-formatted-string')?.textContent,
      () => pr?.microformat?.playerMicroformatRenderer?.publishDate,
    ];
    for (const f of m) {
      try {
        const d = f();
        if (d) return d;
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  _extractDuration(pr) {
    const m = [
      () => $('meta[itemprop="duration"]')?.content,
      () => {
        const v = $('video');
        return v?.duration ? Math.floor(v.duration) : null;
      },
      () => pr?.videoDetails?.lengthSeconds,
    ];
    for (const f of m) {
      try {
        const d = f();
        if (d) return d;
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  _extractKeywords(pr) {
    const m = [
      () =>
        $('meta[name="keywords"]')
          ?.content?.split(',')
          .map(k => k.trim()),
      () => pr?.videoDetails?.keywords,
    ];
    for (const f of m) {
      try {
        const k = f();
        if (k?.length) return k;
      } catch (e) {
        continue;
      }
    }
    return [];
  }

  _extractCategory(pr) {
    try {
      return pr?.microformat?.playerMicroformatRenderer?.category;
    } catch (e) {
      return null;
    }
  }

  _extractJsonLd() {
    try {
      const s = $('script[type="application/ld+json"]');
      if (s && s.textContent) return jp(s.textContent);
    } catch (e) {
      return null;
    }
    return null;
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

  _getCache(vid) {
    const c = this.cache.get(vid);
    return c && Date.now() - c.ts < this.cacheTimeout ? c.data : null;
  }
  _setCache(vid, d) {
    this.cache.set(vid, { data: d, ts: Date.now() });
  }
  clearCache() {
    this.cache.clear();
    this.log('info', 'Cache cleared');
  }
}

export default new MetadataExtractor();
export { MetadataExtractor };
