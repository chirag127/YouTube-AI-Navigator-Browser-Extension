import { gu } from '../../../utils/shortcuts/runtime.js';

const { l, w, e } = await import(gu('utils/shortcuts/log.js'));
const { js } = await import(gu('utils/shortcuts/global.js'));
const { ae, qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { sg, slg: lg } = await import(gu('utils/shortcuts/storage.js'));
const { ft } = await import(gu('utils/shortcuts/network.js'));
const { mp, jn } = await import(gu('utils/shortcuts/array.js'));
class CommentsExtractor {
  constructor() {
    this.comments = [];
    this.hasIntercepted = false;
    ae(window, 'message', ev => {
      if (ev.source !== window) return;
      if (ev.data.type === 'YT_COMMENTS') this.handleInterceptedComments(ev.data.payload);
    });
  }
  handleInterceptedComments(d) {
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
          l(`[CE] Int ${nc.length}`);
        }
      }
    } catch (x) {
      e('[CE] Err int:', x);
    }
  }
  async getComments() {
    const vid = this.getCurrentVideoId();
    const cfg = await this.getConfig();
    if (!cfg.comments?.enabled) return [];
    if (cfg.cache?.enabled && cfg.cache?.comments) {
      try {
        const c = await this.checkCache(vid);
        if (c && c.length > 0) return c;
      } catch (x) {
        w('[CE] Cache fail:', x.message);
      }
    }
    if (this.hasIntercepted && this.comments.length > 0) return this.comments;
    if (cfg.scroll?.autoScrollToComments) await this.scrollToComments();
    return this.fetchCommentsFromDOM();
  }
  async getConfig() {
    try {
      const r = await sg('config');
      return r.config || {};
    } catch (x) {
      w('[CE] Cfg fail:', x);
      return {};
    }
  }
  async checkCache(vid) {
    const k = `video_${vid}_comments`;
    const r = await lg(k);
    if (r[k]) {
      const c = r[k];
      const age = Date.now() - c.timestamp;
      if (age < 86400000 && c.data?.length > 0) return c.data;
    }
    return null;
  }
  async scrollToComments() {
    const { getScrollManager } = await import(
      gu('content/utils/scroll-manager.js')
    );
    const sm = getScrollManager();
    await sm.scrollToComments();
  }
  getCurrentVideoId() {
    return new URLSearchParams(window.location.search).get('v');
  }
  async getInitialDataFromMainWorld() {
    return new Promise(r => {
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
  }
  async fetchCommentsFromDOM() {
    return new Promise(r =>
      setTimeout(() => {
        const c = [];
        const el = $$('ytd-comment-thread-renderer');
        if (el.length === 0) w('[CE] No comment elements found');
        for (let i = 0; i < el.length; i++) {
          if (c.length >= 20) break;
          const elm = el[i];
          try {
            const a = elm.querySelector('#author-text')?.textContent?.trim();
            const t = elm.querySelector('#content-text')?.textContent?.trim();
            const lk = elm.querySelector('#vote-count-middle')?.textContent?.trim() || '0';
            if (a && t) c.push({ author: a, text: t, likes: lk });
            else w(`[CE] Skip ${i + 1}: missing author or text`);
          } catch (x) {
            e(`[CE] Err ${i + 1}:`, x);
          }
        }
        r(c);
      }, 1e3)
    );
  }
  async fetchCommentsActive(k, t, c) {
    try {
      const r = await ft(`https://www.youtube.com/youtubei/v1/next?key=${k}`, {
        method: 'POST',
        body: js({ context: c, continuation: t }),
      });
      const d = await r.json();
      return this.parseComments(d);
    } catch (x) {
      e('[CE] Act fetch fail:', x);
      return { comments: [], nextToken: null };
    }
  }
  parseComments(d) {
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
    return { comments: c, nextToken: nt };
  }
}
const ex = new CommentsExtractor();
export const getComments = ex.getComments.bind(ex);
