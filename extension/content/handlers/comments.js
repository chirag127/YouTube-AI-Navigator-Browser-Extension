import { gu } from '../../utils/shortcuts/runtime.js';

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { js } = await import(gu('utils/shortcuts/global.js'));
const { ae, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { sg, slg: lg } = await import(gu('utils/shortcuts/storage.js'));
const { ft } = await import(gu('utils/shortcuts/network.js'));
const { mp, jn } = await import(gu('utils/shortcuts/array.js'));
class CommentsExtractor {
  constructor() {
    l('CommentsExtractor:Start');
    try {
      this.comments = [];
      this.hasIntercepted = false;
      ae(window, 'message', ev => {
        if (ev.source !== window) return;
        if (ev.data.type === 'YT_COMMENTS') this.handleInterceptedComments(ev.data.payload);
      });
      l('CommentsExtractor:End');
    } catch (err) {
      e('Err:CommentsExtractor', err);
    }
  }
  handleInterceptedComments(d) {
    l('[CE] Handle intercepted start');
    try {
      const i =
        d.onResponseReceivedEndpoints?.[1]?.reloadContinuationItemsCommand?.continuationItems ||
        d.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems ||
        d.frameworkUpdates?.entityBatchUpdate?.mutations;
      if (i) {
        const nc = [];
        for (const it of i) {
          if (it.commentThreadRenderer) {
            const c = it.commentThreadRenderer.comment.commentRenderer;
            nc.push({
              id: c.commentId,
              author: c.authorText?.simpleText || 'Unknown',
              text:
                jn(
                  mp(c.contentText?.runs || [], r => r.text),
                  ''
                ) || '',
              likes: c.voteCount?.simpleText || '0',
              publishedTime: c.publishedTimeText?.runs?.[0]?.text || '',
            });
          }
        }
        if (nc.length > 0) {
          this.comments = [...this.comments, ...nc];
          this.hasIntercepted = true;
          l(`[CE] Int ${nc.length} comments`);
        } else {
          l('[CE] No new comments in intercepted data');
        }
      } else {
        l('[CE] No continuation items in intercepted data');
      }
    } catch (x) {
      e('[CE] Err int:', x);
    }
    l('[CE] Handle intercepted end');
  }
  async getComments() {
    l('[CE] Get comments start');
    const vid = this.getCurrentVideoId();
    l(`[CE] Video ID: ${vid}`);
    const cfg = await this.getConfig();
    l(`[CE] Config loaded: comments enabled=${cfg.comments?.enabled}`);
    if (!cfg.comments?.enabled) {
      l('[CE] Comments disabled');
      return [];
    }
    if (cfg.cache?.enabled && cfg.cache?.comments) {
      try {
        const c = await this.checkCache(vid);
        if (c && c.length > 0) {
          l(`[CE] Cache hit: ${c.length} comments`);
          return c;
        }
      } catch (x) {
        l('[CE] Cache fail:', x.message);
      }
    }
    if (this.hasIntercepted && this.comments.length > 0) {
      l(`[CE] Using intercepted: ${this.comments.length} comments`);
      return this.comments;
    }
    if (cfg.scroll?.autoScrollToComments) {
      l('[CE] Scrolling to comments');
      await this.scrollToComments();
    }
    const result = await this.fetchCommentsFromDOM();
    l(`[CE] Get comments end: ${result.length} comments`);
    return result;
  }
  async getConfig() {
    l('getConfig:Start');
    try {
      const r = await sg('config');
      l('getConfig:End');
      return r.config || {};
    } catch (x) {
      l('[CE] Cfg fail:', x);
      return {};
    }
  }
  async checkCache(vid) {
    l('checkCache:Start');
    try {
      const k = `video_${vid}_comments`;
      const r = await lg(k);
      if (r[k]) {
        const c = r[k];
        const age = Date.now() - c.timestamp;
        if (age < 86400000 && c.data?.length > 0) {
          l('checkCache:End');
          return c.data;
        }
      }
      l('checkCache:End');
      return null;
    } catch (err) {
      e('Err:checkCache', err);
      return null;
    }
  }
  async scrollToComments() {
    l('scrollToComments:Start');
    try {
      const { getScrollManager } = await import(gu('content/utils/scroll-manager.js'));
      const sm = getScrollManager();
      await sm.scrollToComments();
      l('scrollToComments:End');
    } catch (err) {
      e('Err:scrollToComments', err);
    }
  }
  getCurrentVideoId() {
    l('getCurrentVideoId:Start');
    try {
      const result = new URLSearchParams(window.location.search).get('v');
      l('getCurrentVideoId:End');
      return result;
    } catch (err) {
      e('Err:getCurrentVideoId', err);
      return null;
    }
  }
  async getInitialDataFromMainWorld() {
    l('getInitialDataFromMainWorld:Start');
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
        setTimeout(() => {
          window.removeEventListener('message', lis);
          r(null);
        }, 1e3);
      });
      l('getInitialDataFromMainWorld:End');
      return result;
    } catch (err) {
      e('Err:getInitialDataFromMainWorld', err);
      return null;
    }
  }
  async fetchCommentsFromDOM() {
    l('[CE] Start DOM fetch');
    const maxRetries = 3;
    const baseDelay = 2000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      l(`[CE] Attempt ${attempt}/${maxRetries}`);
      const delay = baseDelay * attempt;
      await new Promise(r => setTimeout(r, delay));
      try {
        const c = [];
        const el = $$('ytd-comment-thread-renderer');
        l(`[CE] Found ${el.length} comment elements`);
        if (el.length === 0) {
          l('[CE] No comment elements found');
          continue;
        }
        for (let i = 0; i < el.length; i++) {
          if (c.length >= 20) break;
          const elm = el[i];
          try {
            const a = elm.querySelector('#author-text')?.textContent?.trim();
            const t = elm.querySelector('#content-text')?.textContent?.trim();
            const lk = elm.querySelector('#vote-count-middle')?.textContent?.trim() || '0';
            if (a && t) {
              c.push({ author: a, text: t, likes: lk });
              l(`[CE] Added comment ${c.length}: ${a}`);
            } else {
              l(`[CE] Skip ${i + 1}: missing author or text`);
            }
          } catch (x) {
            e(`[CE] Err ${i + 1}:`, x);
          }
        }
        if (c.length > 0) {
          l(`[CE] Success: ${c.length} comments`);
          return c;
        }
        l(`[CE] No valid comments on attempt ${attempt}`);
      } catch (x) {
        e(`[CE] Attempt ${attempt} failed:`, x);
      }
    }
    l('[CE] All attempts failed, returning empty');
    return [];
  }
  async fetchCommentsActive(k, t, c) {
    l('fetchCommentsActive:Start');
    try {
      const r = await ft(`https://www.youtube.com/youtubei/v1/next?key=${k}`, {
        method: 'POST',
        body: js({ context: c, continuation: t }),
      });
      const d = await r.json();
      const result = this.parseComments(d);
      l('fetchCommentsActive:End');
      return result;
    } catch (x) {
      e('Err:fetchCommentsActive', x);
      return { comments: [], nextToken: null };
    }
  }
  parseComments(d) {
    l('parseComments:Start');
    try {
      const i =
        d.onResponseReceivedEndpoints?.[1]?.reloadContinuationItemsCommand?.continuationItems ||
        d.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems ||
        d.frameworkUpdates?.entityBatchUpdate?.mutations;
      const c = [];
      let nt = null;
      if (i) {
        for (const it of i) {
          if (it.commentThreadRenderer) {
            const cm = it.commentThreadRenderer.comment.commentRenderer;
            c.push({
              id: cm.commentId,
              author: cm.authorText?.simpleText || 'Unknown',
              text:
                jn(
                  mp(cm.contentText?.runs || [], r => r.text),
                  ''
                ) || '',
              likes: cm.voteCount?.simpleText || '0',
              publishedTime: cm.publishedTimeText?.runs?.[0]?.text || '',
            });
          } else if (it.continuationItemRenderer) {
            nt = it.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
          }
        }
      }
      l('parseComments:End');
      return { comments: c, nextToken: nt };
    } catch (err) {
      e('Err:parseComments', err);
      return { comments: [], nextToken: null };
    }
  }
}
const ex = new CommentsExtractor();
export const getComments = ex.getComments.bind(ex);
