const gu = p => chrome.runtime.getURL(p);

const { deArrowAPI } = await import(gu('api/dearrow.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { jp } = await import(gu('utils/shortcuts/core.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
const { ae, qs: $ } = await import(gu('utils/shortcuts/dom.js'));
class MetadataExtractor {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 300000;
  }
  log(lvl, msg) {
    const i = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
    const f = lvl === 'error' ? e : l;
    f(`[ME] ${i[lvl]} ${msg}`);
  }
  async extract(vid, opt = {}) {
    l('extract:Start');
    try {
      const { useDeArrow = true, usePrivateDeArrow = true } = opt;
      this.log('info', `Extr: ${vid}`);
      const c = this._getCache(vid);
      if (c) {
        l('extract:End');
        return c;
      }
      let md = null,
        da = null;
      if (useDeArrow) {
        try {
          da = await deArrowAPI.getVideoMetadata(vid, { usePrivateAPI: usePrivateDeArrow });
        } catch (x) {
          this.log('info', `DA fail: ${x.message}`);
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
          this._setCache(vid, md);
          l('extract:End');
          return md;
        }
      } catch (x) {
        this.log('info', `DOM fail: ${x.message}`);
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
            this._setCache(vid, md);
            l('extract:End');
            return md;
          }
        } catch (x) {
          this.log('info', `JSON-LD fail: ${x.message}`);
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
      this._setCache(vid, md);
      l('extract:End');
      return md;
    } catch (err) {
      e('Err:extract', err);
      throw err;
    }
  }
  _extractTitle(pr) {
    l('_extractTitle:Start');
    try {
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
          if (t?.trim()) {
            l('_extractTitle:End');
            return t.trim();
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractTitle:End');
      return 'Unknown Title';
    } catch (err) {
      e('Err:_extractTitle', err);
      return 'Unknown Title';
    }
  }
  _extractDescription(pr) {
    l('_extractDescription:Start');
    try {
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
          if (d?.trim()) {
            l('_extractDescription:End');
            return d.trim();
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractDescription:End');
      return '';
    } catch (err) {
      e('Err:_extractDescription', err);
      return '';
    }
  }
  _extractAuthor(pr) {
    l('_extractAuthor:Start');
    try {
      const m = [
        () => $('ytd-channel-name#channel-name yt-formatted-string a')?.textContent,
        () => $('#owner-name a')?.textContent,
        () => $('link[itemprop="name"]')?.content,
        () => pr?.videoDetails?.author,
      ];
      for (const f of m) {
        try {
          const a = f();
          if (a?.trim()) {
            l('_extractAuthor:End');
            return a.trim();
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractAuthor:End');
      return 'Unknown Channel';
    } catch (err) {
      e('Err:_extractAuthor', err);
      return 'Unknown Channel';
    }
  }
  _extractViewCount(pr) {
    l('_extractViewCount:Start');
    try {
      const m = [
        () => this._parseViewCount($('ytd-video-view-count-renderer span.view-count')?.textContent),
        () => this._parseViewCount($('#info-container #count')?.textContent),
        () => pr?.videoDetails?.viewCount,
      ];
      for (const f of m) {
        try {
          const v = f();
          if (v) {
            l('_extractViewCount:End');
            return v;
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractViewCount:End');
      return 'Unknown';
    } catch (err) {
      e('Err:_extractViewCount', err);
      return 'Unknown';
    }
  }
  _parseViewCount(t) {
    l('_parseViewCount:Start');
    try {
      if (!t) {
        l('_parseViewCount:End');
        return null;
      }
      const m = t.match(/[\d,]+/);
      const result = m ? m[0].replace(/,/g, '') : null;
      l('_parseViewCount:End');
      return result;
    } catch (err) {
      e('Err:_parseViewCount', err);
      return null;
    }
  }
  _extractPublishDate(pr) {
    l('_extractPublishDate:Start');
    try {
      const m = [
        () => $('meta[itemprop="uploadDate"]')?.content,
        () => $('#info-strings yt-formatted-string')?.textContent,
        () => pr?.microformat?.playerMicroformatRenderer?.publishDate,
      ];
      for (const f of m) {
        try {
          const d = f();
          if (d) {
            l('_extractPublishDate:End');
            return d;
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractPublishDate:End');
      return null;
    } catch (err) {
      e('Err:_extractPublishDate', err);
      return null;
    }
  }
  _extractDuration(pr) {
    l('_extractDuration:Start');
    try {
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
          if (d) {
            l('_extractDuration:End');
            return d;
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractDuration:End');
      return null;
    } catch (err) {
      e('Err:_extractDuration', err);
      return null;
    }
  }
  _extractKeywords(pr) {
    l('_extractKeywords:Start');
    try {
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
          if (k?.length) {
            l('_extractKeywords:End');
            return k;
          }
        } catch (e) {
          continue;
        }
      }
      l('_extractKeywords:End');
      return [];
    } catch (err) {
      e('Err:_extractKeywords', err);
      return [];
    }
  }
  _extractCategory(pr) {
    l('_extractCategory:Start');
    try {
      const result = pr?.microformat?.playerMicroformatRenderer?.category;
      l('_extractCategory:End');
      return result;
    } catch (err) {
      e('Err:_extractCategory', err);
      return null;
    }
  }
  _extractJsonLd() {
    l('_extractJsonLd:Start');
    try {
      const s = $('script[type="application/ld+json"]');
      if (s && s.textContent) {
        const result = jp(s.textContent);
        l('_extractJsonLd:End');
        return result;
      }
      l('_extractJsonLd:End');
      return null;
    } catch (err) {
      e('Err:_extractJsonLd', err);
      return null;
    }
  }
  async getInitialData() {
    l('getInitialData:Start');
    try {
      const result = await new Promise(r => {
        const lis = ev => {
          if (ev.source !== window) return;
          if (ev.data.type === 'YT_DATA_RESPONSE') {
            window.removeEventListener('message', lis);
            r(ev.data.payload);
          }
        };
        ae(window, 'message', lis);
        window.postMessage({ type: 'YT_GET_DATA' }, '*');
        to(() => {
          window.removeEventListener('message', lis);
          r(null);
        }, 1000);
      });
      l('getInitialData:End');
      return result;
    } catch (err) {
      e('Err:getInitialData', err);
      return null;
    }
  }
  _getCache(vid) {
    l('_getCache:Start');
    try {
      const c = this.cache.get(vid);
      const result = c && Date.now() - c.ts < this.cacheTimeout ? c.data : null;
      l('_getCache:End');
      return result;
    } catch (err) {
      e('Err:_getCache', err);
      return null;
    }
  }
  _setCache(vid, d) {
    l('_setCache:Start');
    try {
      this.cache.set(vid, { data: d, ts: Date.now() });
      l('_setCache:End');
    } catch (err) {
      e('Err:_setCache', err);
    }
  }
  clearCache() {
    l('clearCache:Start');
    try {
      this.cache.clear();
      this.log('info', 'Cache cleared');
      l('clearCache:End');
    } catch (err) {
      e('Err:clearCache', err);
    }
  }
}
export const metadataExtractor = new MetadataExtractor();
export { MetadataExtractor };
