import { l, e, $, $$, jp, inc, mt, tc, tr, uc, fc, ps, st, doc, win } from '../utils/shortcuts.js';
class YTE {
  constructor() {
    this.of = win.fetch.bind(win);
    this.ls = new Map();
    this.iu = new Set();
    this.ii();
    this.inl();
    win.addEventListener('message', e => {
      if (e.source !== win) return;
      if (e.data.type === 'YT_GET_DATA') this.e('data_response', this.gid());
    });
    win._ytExtractor = this;
    l('[YTE] Init');
  }

  ii() {
    window.fetch = async (...a) => {
      const [r, c] = a;
      const u = r ? r.toString() : '';
      if (this.iu.has(u)) return this.of(r, c);
      const res = await this.of(r, c);
      this.pr(u, res).catch(e => console.error('[YTE] Err:', e));
      return res;
    };
  }

  async pr(u, r) {
    if (u.includes('/youtubei/v1/player')) {
      try {
        this.e('metadata', await r.clone().json());
      } catch (e) {}
    } else if (u.includes('/youtubei/v1/next')) {
      try {
        this.e('comments', await r.clone().json());
      } catch (e) {}
    } else if (u.includes('/api/timedtext') || u.includes('/youtubei/v1/get_transcript')) {
      this.htu(u);
    } else if (u.includes('/youtubei/v1/live_chat/get_live_chat')) {
      try {
        this.e('live_chat', await r.clone().json());
      } catch (e) {}
    } else if (u.includes('/youtubei/v1/reel/')) {
      try {
        this.e('shorts_data', await r.clone().json());
      } catch (e) {}
    }
  }

  async htu(u) {
    if (this.iu.has(u)) return;
    console.log('[YTE] Cap tr:', u);
    this.iu.add(u);
    try {
      const r = await this.of(u);
      if (!r.ok) {
        console.error('[YTE] Fail:', r.status);
        this.iu.delete(u);
        return;
      }
      const d = await r.json();
      console.log('[YTE] Got tr');
      this.e('transcript', d);
      setTimeout(() => this.iu.delete(u), 1e4);
    } catch (e) {
      console.error('[YTE] Err:', e);
      this.iu.delete(u);
    }
  }

  inl() {
    document.addEventListener('yt-navigate-finish', e => {
      const vid = e.detail?.response?.playerResponse?.videoDetails?.videoId;
      console.log('[YTE] Nav:', vid);
      this.e('navigation', { videoId: vid, detail: e.detail });
    });
  }

  gid() {
    let pr = window.ytInitialPlayerResponse;
    if (!pr) {
      try {
        const a = document.querySelector('ytd-app');
        pr = a?.data?.playerResponse || a?.__data?.playerResponse;
      } catch (e) {}
    }
    if (!pr) {
      try {
        for (const s of document.querySelectorAll('script')) {
          const m = (s.textContent || '').match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
          if (m) {
            pr = JSON.parse(m[1]);
            break;
          }
        }
      } catch (e) {}
    }
    if (!pr && window.ytplayer?.config?.args?.player_response) {
      try {
        pr = JSON.parse(window.ytplayer.config.args.player_response);
      } catch (e) {}
    }
    return {
      playerResponse: pr,
      initialData: window.ytInitialData,
      cfg: window.ytcfg?.data_,
    };
  }

  on(e, c) {
    if (!this.ls.has(e)) this.ls.set(e, []);
    this.ls.get(e)?.push(c);
  }

  e(ev, d) {
    this.ls.get(ev)?.forEach(c => c(d));
    window.postMessage({ type: `YT_${ev.toUpperCase()}`, payload: d }, '*');
  }

  em() {
    const pr = window.ytInitialPlayerResponse;
    if (!pr) return null;
    const d = pr.videoDetails,
      m = pr.microformat?.playerMicroformatRenderer;
    return {
      title: d?.title,
      videoId: d?.videoId,
      author: d?.author,
      viewCount: d?.viewCount,
      lengthSeconds: d?.lengthSeconds,
      description: d?.shortDescription,
      isLive: d?.isLiveContent,
      keywords: d?.keywords || [],
      channelId: d?.channelId,
      uploadDate: m?.uploadDate || '',
    };
  }

  esm() {
    const as = document.querySelector('ytd-reel-video-renderer[is-active]');
    if (!as) return null;
    const t = as.querySelector('.ytd-reel-player-header-renderer-title')?.textContent;
    const c = as.querySelector('.ytd-channel-name')?.textContent;
    return { title: t?.trim(), channel: c?.trim() };
  }
}
new YTE();
