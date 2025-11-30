const w = window,
  d = document;
(async () => {
  if (window.top !== window) return;
  const extId = document.currentScript?.src.split('://')[1]?.split('/')[0];
  const baseUrl = extId ? `chrome-extension://${extId}/` : '../';
  const { e } = await import(baseUrl + 'utils/shortcuts/log.js');
  const { jp, to: st } = await import(baseUrl + 'utils/shortcuts/core.js');
  const { qs: $, qsa, on } = await import(baseUrl + 'utils/shortcuts/dom.js');
  const uc = s => s.toUpperCase();
  class YTE {
    constructor() {
      try {
        this.of = w.fetch.bind(w);
        this.ls = new Map();
        this.iu = new Set();
        this.ii();
        this.inl();
        on(w, 'message', ev => {
          if (ev.source !== w) return;
          if (ev.data.type === 'YT_GET_DATA') this.e('data_response', this.gid());
        });
        w._ytExtractor = this;
      } catch (err) {
        e('Err:YTE', err);
      }
    }
    ii() {
      try {
        w.fetch = async (...a) => {
          const [r, c] = a;
          const u = r ? r.toString() : '';
          if (this.iu.has(u)) return this.of(r, c);
          const res = await this.of(r, c);
          this.pr(u, res).catch(err => e('Err:ii:pr', err));
          return res;
        };
      } catch (err) {
        e('Err:ii', err);
      }
    }
    async pr(u, r) {
      try {
        if (u.includes('/youtubei/v1/player')) {
          try {
            this.e('metadata', await r.clone().json());
          } catch (err) {
            e('Err:pr:metadata', err);
          }
        } else if (u.includes('/youtubei/v1/next')) {
          try {
            this.e('comments', await r.clone().json());
          } catch (err) {
            e('Err:pr:comments', err);
          }
        } else if (u.includes('/api/timedtext') || u.includes('/youtubei/v1/get_transcript')) {
          this.htu(u);
        } else if (u.includes('/youtubei/v1/live_chat/get_live_chat')) {
          try {
            this.e('live_chat', await r.clone().json());
          } catch (err) {
            e('Err:pr:live_chat', err);
          }
        } else if (u.includes('/youtubei/v1/reel/')) {
          try {
            this.e('shorts_data', await r.clone().json());
          } catch (err) {
            e('Err:pr:shorts', err);
          }
        }
      } catch (err) {
        e('Err:pr', err);
      }
    }
    async htu(u) {
      if (this.iu.has(u)) return;
      this.iu.add(u);
      try {
        const r = await this.of(u);
        if (!r.ok) {
          e('Err:htu:fail', r.status);
          this.iu.delete(u);
          return;
        }
        const d = await r.json();
        this.e('transcript', d);
        st(() => this.iu.delete(u), 1e4);
      } catch (err) {
        e('Err:htu', err);
        this.iu.delete(u);
      }
    }
    inl() {
      try {
        on(d, 'yt-navigate-finish', ev => {
          const vid = ev.detail?.response?.playerResponse?.videoDetails?.videoId;
          this.e('navigation', { videoId: vid, detail: ev.detail });
        });
      } catch (err) {
        e('Err:inl', err);
      }
    }
    gid() {
      try {
        let pr = w.ytInitialPlayerResponse;
        if (!pr) {
          try {
            const a = $('ytd-app');
            pr = a?.data?.playerResponse || a?.__data?.playerResponse;
          } catch (err) {
            e('Err:gid:app', err);
          }
        }
        if (!pr) {
          try {
            for (const s of qsa('script')) {
              const m = (s.textContent || '').match(/ytInitialPlayerResponse\s*=\s*({.+?});/s);
              if (m) {
                pr = jp(m[1]);
                break;
              }
            }
          } catch (err) {
            e('Err:gid:script', err);
          }
        }
        if (!pr && w.ytplayer?.config?.args?.player_response) {
          try {
            pr = jp(w.ytplayer.config.args.player_response);
          } catch (err) {
            e('Err:gid:ytplayer', err);
          }
        }
        return {
          playerResponse: pr,
          initialData: w.ytInitialData,
          cfg: w.ytcfg?.data_,
        };
      } catch (err) {
        e('Err:gid', err);
        return null;
      }
    }
    on(e, c) {
      try {
        if (!this.ls.has(e)) this.ls.set(e, []);
        this.ls.get(e)?.push(c);
      } catch (err) {
        e('Err:on', err);
      }
    }
    e(ev, d) {
      try {
        this.ls.get(ev)?.forEach(c => c(d));
        w.postMessage({ type: `YT_${uc(ev)}`, payload: d }, '*');
      } catch (err) {
        e('Err:e', err);
      }
    }
    em() {
      try {
        const pr = w.ytInitialPlayerResponse;
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
      } catch (err) {
        e('Err:em', err);
        return null;
      }
    }
    esm() {
      try {
        const as = $('ytd-reel-video-renderer[is-active]');
        if (!as) return null;
        const t = as.querySelector('.ytd-reel-player-header-renderer-title')?.textContent;
        const c = as.querySelector('.ytd-channel-name')?.textContent;
        return { title: t?.trim(), channel: c?.trim() };
      } catch (err) {
        e('Err:esm', err);
        return null;
      }
    }
  }
  new YTE();
})();
