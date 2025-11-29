import { l, w, e, on, msg, sg, lg, $$, $, ft, js, mp, jn } from '../utils/shortcuts.js';

class CommentsExtractor {
  constructor() {
    this.comments = [];
    this.hasIntercepted = false;
    on(window, 'message', ev => {
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
          l(`[CommentsExtractor] Intercepted ${nc.length} comments`);
        }
      }
    } catch (x) {
      e('[CommentsExtractor] Error parsing intercepted comments:', x);
    }
  }

  async getComments() {
    l('[CommentsExtractor] 💬 === STARTING COMMENT EXTRACTION ===');
    const vid = this.getCurrentVideoId();
    const cfg = await this.getConfig();
    if (!cfg.comments?.enabled) {
      l('[CommentsExtractor] ⏭️ Comments disabled in settings');
      return [];
    }
    if (cfg.cache?.enabled && cfg.cache?.comments) {
      try {
        const c = await this.checkCache(vid);
        if (c && c.length > 0) {
          l(`[CommentsExtractor] ✅ Strategy 0: Using cached comments (${c.length}) - NO SCROLL`);
          return c;
        }
      } catch (x) {
        w('[CommentsExtractor] ⚠️ Cache check failed:', x.message);
      }
    }
    if (this.hasIntercepted && this.comments.length > 0) {
      l('[CommentsExtractor] ✅ Strategy 1: Using intercepted comments', {
        count: this.comments.length,
      });
      return this.comments;
    }
    l('[CommentsExtractor] ⏭️ Strategy 1: No intercepted comments available');
    try {
      l('[CommentsExtractor] 🔧 Strategy 2: Trying InnerTube API...', { videoId: vid, limit: 20 });
      const pl = { action: 'INNERTUBE_GET_COMMENTS', videoId: vid, limit: 20 };
      l('[CommentsExtractor] 📤 Sending message to background:', pl);
      const r = await msg(pl);
      l('[CommentsExtractor] 📥 Received response from background:', {
        success: r?.success,
        hasComments: !!r?.comments,
        commentsCount: r?.comments?.length || 0,
        error: r?.error,
        fullResponse: r,
      });
      if (r.success && r.comments?.length > 0) {
        l(
          `[CommentsExtractor] ✅ Strategy 2: InnerTube fetched ${r.comments.length} comments - NO SCROLL`
        );
        return r.comments;
      } else
        w(`[CommentsExtractor] ⚠️ Strategy 2: InnerTube returned no comments`, {
          success: r?.success,
          error: r?.error,
        });
    } catch (x) {
      e('[CommentsExtractor] ❌ Strategy 2: InnerTube fetch failed:', {
        errorType: x.constructor.name,
        errorMessage: x.message,
        errorStack: x.stack,
      });
    }
    l('[CommentsExtractor] 🔧 Strategy 3: DOM scraping');
    if (cfg.scroll?.autoScrollToComments) {
      l('[CommentsExtractor] 📜 Auto-scroll enabled - scrolling to comments');
      await this.scrollToComments();
    } else l('[CommentsExtractor] ⏭️ Auto-scroll DISABLED - skipping scroll');
    return this.fetchCommentsFromDOM();
  }

  async getConfig() {
    try {
      const r = await sg('config');
      return r.config || {};
    } catch (x) {
      w('[CommentsExtractor] Config load failed:', x);
      return {};
    }
  }

  async checkCache(vid) {
    const k = `video_${vid}_comments`;
    const r = await lg(k);
    if (r[k]) {
      const c = r[k];
      const age = Date.now() - c.timestamp;
      if (age < 86400000 && c.data?.length > 0) {
        l(
          `[CommentsExtractor] 📦 Cache hit: ${c.data.length} comments (age: ${Math.round(age / 60000)}min)`
        );
        return c.data;
      }
      l(`[CommentsExtractor] 📦 Cache expired or empty`);
    }
    return null;
  }

  async scrollToComments() {
    const { getScrollManager } = await import(
      chrome.runtime.getURL('content/utils/scroll-manager.js')
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
      on(window, 'message', lis);
      window.postMessage({ type: 'YT_GET_DATA' }, '*');
      setTimeout(() => {
        window.removeEventListener('message', lis);
        r(null);
      }, 1000);
    });
  }

  async fetchCommentsFromDOM() {
    l('[CommentsExtractor] 🔍 Starting DOM scraping...');
    return new Promise(r =>
      setTimeout(() => {
        const c = [];
        const el = qsa('ytd-comment-thread-renderer');
        l(`[CommentsExtractor] 📊 DOM Query Results:`, {
          selector: 'ytd-comment-thread-renderer',
          elementsFound: el.length,
          documentReady: document.readyState,
          commentsSection: !!qs('ytd-comments'),
          commentsExpanded: !!qs('ytd-comments[expanded]'),
        });
        if (el.length === 0)
          w('[CommentsExtractor] ⚠️ No comment elements found. Possible reasons:', {
            commentsNotLoaded: "User hasn't scrolled to comments section",
            commentsDisabled: 'Comments may be disabled for this video',
            selectorChanged: 'YouTube may have changed their DOM structure',
          });
        for (let i = 0; i < el.length; i++) {
          if (c.length >= 20) {
            l(`[CommentsExtractor] 🛑 Reached limit of 20 comments`);
            break;
          }
          const e = el[i];
          try {
            const a = e.querySelector('#author-text')?.textContent?.trim();
            const t = e.querySelector('#content-text')?.textContent?.trim();
            const lk = e.querySelector('#vote-count-middle')?.textContent?.trim() || '0';
            l(`[CommentsExtractor] 🔍 Comment ${i + 1}/${el.length}:`, {
              hasAuthor: !!a,
              hasText: !!t,
              author: a,
              textPreview: t?.substring(0, 50) + (t?.length > 50 ? '...' : ''),
              likes: lk,
            });
            if (a && t) c.push({ author: a, text: t, likes: lk });
            else
              w(`[CommentsExtractor] ⏭️ Skipping comment ${i + 1} - missing data:`, {
                hasAuthor: !!a,
                hasText: !!t,
              });
          } catch (x) {
            e(`[CommentsExtractor] ❌ Error parsing comment ${i + 1}:`, {
              errorType: x.constructor.name,
              errorMessage: x.message,
              element: e,
            });
          }
        }
        l(`[CommentsExtractor] ✅ DOM scraping complete:`, {
          totalElements: el.length,
          successfullyParsed: c.length,
          failed: el.length - c.length,
        });
        r(c);
      }, 1000)
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
      e('[CommentsExtractor] Active fetch failed:', x);
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
