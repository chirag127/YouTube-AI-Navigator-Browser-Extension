const gu = p => chrome.runtime.getURL(p);

const { state } = await import(gu('content/core/state.js'));
const { showLoading, showPlaceholder } = await import(gu('content/ui/components/loading.js'));
const { getComments } = await import(gu('content/handlers/comments.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
const { rs } = await import(gu('utils/shortcuts/runtime.js'));
const { sg } = await import(gu('utils/shortcuts/storage.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { mp, jn, slc } = await import(gu('utils/shortcuts/array.js'));
const { ce, tc, ap, ih, dc: doc } = await import(gu('utils/shortcuts/dom.js'));
export async function renderComments(c) {
  l('renderComments:Start');
  try {
    if (state.analysisData?.commentAnalysis) {
      const html = await parseMarkdown(state.analysisData.commentAnalysis);
      ih(c, `<div class="yt-ai-markdown">${html}</div>`);
      l('renderComments:End');
      return;
    }
    showLoading(c, 'Fetching comments...');
    try {
      const cm = await getComments();
      if (!cm.length) {
        showPlaceholder(c, 'No comments found.');
        l('renderComments:End');
        return;
      }
      showLoading(c, 'Analyzing...');
      l('[CR] Sending comments');
      const r = await rs({ action: 'ANALYZE_COMMENTS', comments: cm });
      if (r.success) {
        const cfg = await getConfig();
        if (cfg.scroll?.scrollBackAfterComments)
          scrollBackToTop(cfg.scroll?.showScrollNotification ?? true);
        if (!state.analysisData) state.analysisData = {};
        state.analysisData.commentAnalysis = r.analysis;
        const html = await parseMarkdown(r.analysis);
        ih(
          c,
          `<div class="yt-ai-markdown"><h3>💬 Comment Sentiment Analysis</h3>${html}<hr><h4>Top Comments (${cm.length})</h4>${jn(
            mp(
              slc(cm, 0, 5),
              x =>
                `<div class="yt-ai-comment"><div class="yt-ai-comment-author">${x.author}</div><div class="yt-ai-comment-text">${x.text}</div><div class="yt-ai-comment-likes">👍 ${x.likes}</div></div>`
            ),
            ''
          )}</div>`
        );
      }
      l('renderComments:End');
    } catch (x) {
      ih(c, `<div class="yt-ai-error-msg">Failed: ${x.message}</div>`);
      e('Err:renderComments', x);
    }
  } catch (err) {
    e('Err:renderComments', err);
  }
}
async function getConfig() {
  l('getConfig:Start');
  try {
    const r = await sg('config');
    l('getConfig:End');
    return r.config || {};
  } catch (err) {
    l('getConfig:End');
    return {};
  }
}
function scrollBackToTop(sn = true) {
  l('scrollBackToTop:Start');
  try {
    l('[CR] Scroll top');
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    void document.body.offsetHeight;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (window.scrollY > 0) {
          l('[CR] Scroll fail, retry');
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        l('[CR] Final scroll:', window.scrollY);
      });
    } else {
      setTimeout(() => {
        if (window.scrollY > 0) {
          l('[CR] Scroll fail, retry');
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
        l('[CR] Final scroll:', window.scrollY);
      }, 16);
    }
    if (sn) showScrollNotification();
    l('scrollBackToTop:End');
  } catch (err) {
    e('Err:scrollBackToTop', err);
  }
}
function showScrollNotification() {
  l('showScrollNotification:Start');
  try {
    const n = ce('div');
    n.id = 'yt-ai-scroll-notification';
    tc(n, '⬆️ Scrolled to top');
    n.style.cssText =
      "position:fixed;top:80px;right:20px;background:#3ea6ff;color:white;padding:12px 20px;border-radius:8px;font-family:'Roboto',Arial,sans-serif;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out;";
    ap(doc.body, n);
    to(() => {
      n.style.animation = 'slideOut 0.3s ease-in';
      to(() => n.remove(), 300);
    }, 2000);
    l('showScrollNotification:End');
  } catch (err) {
    e('Err:showScrollNotification', err);
  }
}
