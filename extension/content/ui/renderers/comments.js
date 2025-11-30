const gu = p => chrome.runtime.getURL(p);

const { state } = await import(gu('content/core/state.js'));
const { showLoading, showPlaceholder } = await import(gu('content/ui/components/loading.js'));
const { getComments } = await import(gu('content/handlers/comments.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
const { rs } = await import(gu('utils/shortcuts/runtime.js'));
const { sg } = await import(gu('utils/shortcuts/storage.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
const { e } = await import(gu('utils/shortcuts/log.js'));
const { mp } = await import(gu('utils/shortcuts/core.js'));
const { jn, slc } = await import(gu('utils/shortcuts/string.js'));
const { ce, ap, ih, dc: doc, txt } = await import(gu('utils/shortcuts/dom.js'));
export async function renderComments(c) {
  try {
    if (state.analysisData?.commentAnalysis) {
      const html = await parseMarkdown(state.analysisData.commentAnalysis);
      ih(c, `<div class="yt-ai-markdown">${html}</div>`);
      return;
    }
    showLoading(c, 'Loading comments section...');
    const cfg = await getConfig();
    const origPos = window.scrollY;
    await forceLoadComments();
    showLoading(c, 'Extracting comments...');
    await to(() => {}, 800);
    try {
      const cm = await getComments();
      if (cfg.scroll?.scrollBackAfterComments !== false)
        scrollBackToTop(origPos, cfg.scroll?.showScrollNotification ?? true);
      if (!cm.length) {
        showPlaceholder(c, 'No comments found.');
        return;
      }
      showLoading(c, 'Analyzing...');
      const r = await rs({ action: 'ANALYZE_COMMENTS', comments: cm });
      if (r.success) {
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
    } catch (x) {
      if (cfg.scroll?.scrollBackAfterComments !== false) scrollBackToTop(origPos, false);
      ih(c, `<div class="yt-ai-error-msg">Failed: ${x.message}</div>`);
      e('Err:renderComments', x);
    }
  } catch (err) {
    e('Err:renderComments', err);
  }
}
async function getConfig() {
  try {
    const r = await sg('config');
    return r.config || {};
  } catch (err) {
    return {};
  }
}
async function forceLoadComments() {
  try {
    const cs = doc.querySelector('ytd-comments#comments');
    if (cs) {
      cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await to(() => {}, 1200);
      window.scrollBy(0, 200);
      await to(() => {}, 600);
      return;
    }
    window.scrollTo({ top: doc.documentElement.scrollHeight, behavior: 'smooth' });
    await to(() => {}, 1500);
  } catch (err) {
    e('Err:forceLoadComments', err);
  }
}
function scrollBackToTop(pos = 0, sn = true) {
  try {
    window.scrollTo({ top: pos, behavior: 'smooth' });
    doc.documentElement.scrollTop = pos;
    doc.body.scrollTop = pos;
    void doc.body.offsetHeight;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - pos) > 10) {
          window.scrollTo(pos, pos);
          doc.documentElement.scrollTop = pos;
          doc.body.scrollTop = pos;
        }
      });
    } else {
      to(() => {
        if (Math.abs(window.scrollY - pos) > 10) {
          window.scrollTo(pos, pos);
          doc.documentElement.scrollTop = pos;
          doc.body.scrollTop = pos;
        }
      }, 16);
    }
    if (sn) showScrollNotification();
  } catch (err) {
    e('Err:scrollBackToTop', err);
  }
}
function showScrollNotification() {
  try {
    const n = ce('div');
    n.id = 'yt-ai-scroll-notification';
    txt(n, '⬆️ Scrolled to top');
    n.style.cssText =
      "position:fixed;top:80px;right:20px;background:#3ea6ff;color:white;padding:12px 20px;border-radius:8px;font-family:'Roboto',Arial,sans-serif;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out;";
    ap(doc.body, n);
    to(() => {
      n.style.animation = 'slideOut 0.3s ease-in';
      to(() => n.remove(), 300);
    }, 2000);
  } catch (err) {
    e('Err:showScrollNotification', err);
  }
}
