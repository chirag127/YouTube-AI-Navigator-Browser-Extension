import { gu } from '../../utils/shortcuts/runtime.js';

const { e, w } = await import(gu('utils/shortcuts/log.js'));
const { js, to } = await import(gu('utils/shortcuts/global.js'));
const { ae, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { sg, slg: lg } = await import(gu('utils/shortcuts/storage.js'));
const { ft } = await import(gu('utils/shortcuts/network.js'));
const { mp, jn } = await import(gu('utils/shortcuts/array.js'));
class CommentsExtractor {
  constructor() {
    try {
      this.comments = [];
      this.hasIntercepted = false;
      ae(window, 'message', ev => {
        if (ev.source !== window) return;
        if (ev.data.type === 'YT_COMMENTS') this.handleInterceptedComments(ev.data.payload);
      });
    } catch (err) {
      e('Err:CommentsExtractor', err);
    }
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
        }
      }
    } catch (x) {
      e('[CE] Err int:', x);
    }
  }
  async getComments() {
    const vid = this.getCurrentVideoId();
    const cfg = await this.getConfig();
    if (!cfg.comments?.enabled) {
      return [];
    }
    try {
      const initialData = await this.getInitialDataFromMainWorld();
      if (initialData) {
        const initialComments = this.extractCommentsFromInitialData(initialData);
        if (initialComments.length > 0) {
          return initialComments;
        }
      }
    } catch (err) {
      e('Err:extracting initial comments', err);
    }
    if (cfg.cache?.enabled && cfg.cache?.comments) {
      try {
        const c = await this.checkCache(vid);
        if (c && c.length > 0) {
          return c;
        }
      } catch (x) {
        // cache fail, continue
      }
    }
    if (this.hasIntercepted && this.comments.length > 0) {
      return this.comments;
    }
    if (cfg.scroll?.autoScrollToComments) {
      await this.scrollToComments();
    }
    const result = await this.fetchCommentsFromDOM();
    return result;
  }
  async getConfig() {
    try {
      const r = await sg('config');
      return r.config || {};
    } catch (x) {
      return {};
    }
  }
  async checkCache(vid) {
    try {
      const k = `video_${vid}_comments`;
      const r = await lg(k);
      if (r[k]) {
        const c = r[k];
        const age = Date.now() - c.timestamp;
        if (age < 86400000 && c.data?.length > 0) {
          return c.data;
        }
      }
      return null;
    } catch (err) {
      e('Err:checkCache', err);
      return null;
    }
  }
  async scrollToComments() {
    try {
      const { getScrollManager } = await import(gu('content/utils/scroll-manager.js'));
      const sm = getScrollManager();
      await sm.scrollToComments();
    } catch (err) {
      e('Err:scrollToComments', err);
    }
  }
  getCurrentVideoId() {
    try {
      const result = new URLSearchParams(window.location.search).get('v');
      return result;
    } catch (err) {
      e('Err:getCurrentVideoId', err);
      return null;
    }
  }
  async getInitialDataFromMainWorld() {
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
        }, 1e3);
      });
      return result;
    } catch (err) {
      e('Err:getInitialDataFromMainWorld', err);
      return null;
    }
  }
  extractCommentsFromInitialData(data) {
    try {
      const contents = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
      if (!contents) return [];
      const commentsSection = contents.find(
        c => c.itemSectionRenderer?.contents?.[0]?.commentsEntryPointHeaderRenderer
      );
      if (!commentsSection) return [];
      const commentThreads = contents.filter(c => c.commentThreadRenderer);
      const comments = [];
      for (const thread of commentThreads) {
        const c = thread.commentThreadRenderer?.comment?.commentRenderer;
        if (c) {
          comments.push({
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
      return comments;
    } catch (err) {
      e('Err:extractCommentsFromInitialData', err);
      return [];
    }
  }
  async fetchCommentsFromDOM() {
    const maxRetries = 3;
    const baseDelay = 2000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = baseDelay * attempt;
      await new Promise(r => to(r, delay));
      try {
        const c = [];
        const selectors = ['ytd-comment-thread-renderer', 'ytd-comment-renderer'];
        let el = [];
        for (const sel of selectors) {
          el = $$(sel);
          if (el.length > 0) break;
        }
        if (el.length === 0) {
          continue;
        }
        const getText = (elm, sels) => {
          for (const sel of sels) {
            const e = elm.querySelector(sel);
            if (e && e.textContent?.trim()) return e.textContent.trim();
          }
          return '';
        };
        for (let i = 0; i < el.length; i++) {
          if (c.length >= 20) break;
          const elm = el[i];
          try {
            const a = getText(elm, [
              '#author-text',
              '#author-text yt-formatted-string',
              '[author]',
            ]);
            const t = getText(elm, [
              '#content-text',
              '#content-text yt-formatted-string',
              '[content]',
            ]);
            const lk =
              getText(elm, ['#vote-count-middle', '#vote-count-left', '#vote-count']) || '0';
            const pt = getText(elm, ['#published-time-text', '#published-time']);
            if (a && t) {
              c.push({
                id: elm.id || `dom_${i}`,
                author: a,
                text: t,
                likes: lk,
                publishedTime: pt,
              });
            } else {
              e(`Failed to extract comment ${i + 1}: missing author or text`);
            }
          } catch (x) {
            e(`[CE] Err ${i + 1}:`, x);
          }
        }
        if (c.length > 0) {
          return c;
        } else {
          w('No comments available in DOM');
        }
      } catch (x) {
        e(`[CE] Attempt ${attempt} failed:`, x);
      }
    }
    return [];
  }
  async fetchCommentsActive(k, t, c) {
    try {
      const r = await ft(`https://www.youtube.com/youtubei/v1/next?key=${k}`, {
        method: 'POST',
        body: js({ context: c, continuation: t }),
      });
      const d = await r.json();
      const result = this.parseComments(d);
      return result;
    } catch (x) {
      e('Err:fetchCommentsActive', x);
      return { comments: [], nextToken: null };
    }
  }
  parseComments(d) {
    try {
      const i =
        d.onResponseReceivedEndpoints?.[1]?.reloadContinuationItemsCommand?.continuationItems ||
        d.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems ||
        d.onResponseReceivedEndpoints?.[0]?.reloadContinuationItemsCommand?.continuationItems ||
        d.continuationContents?.itemSectionContinuation?.contents ||
        d.frameworkUpdates?.entityBatchUpdate?.mutations ||
        d.contents?.twoColumnWatchNextResults?.results?.results?.contents;
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
    } catch (err) {
      e('Err:parseComments', err);
      return { comments: [], nextToken: null };
    }
  }
}
const ex = new CommentsExtractor();
export const getComments = ex.getComments.bind(ex);
