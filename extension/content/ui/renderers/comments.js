import { state } from '../../core/state.js';
import { showLoading, showPlaceholder } from '../components/loading.js';
import { getComments } from '../../handlers/comments.js';
import { parseMarkdown } from '../../../lib/marked-loader.js';
import { rs } from '../../utils/shortcuts/runtime.js';
import { sg } from '../../utils/shortcuts/storage.js';
import { to } from '../../utils/shortcuts/global.js';
import { l, w } from '../../utils/shortcuts/log.js';
import { mp, jn, slc } from '../../utils/shortcuts/array.js';
import { ce, tc, ap, ih, dc as doc } from '../../utils/shortcuts/dom.js';
export async function renderComments(c) {
  if (state.analysisData?.commentAnalysis) {
    const html = await parseMarkdown(state.analysisData.commentAnalysis);
    ih(c, `<div class="yt-ai-markdown">${html}</div>`);
    return;
  }
  showLoading(c, 'Fetching comments...');
  try {
    const cm = await getComments();
    if (!cm.length) {
      showPlaceholder(c, 'No comments found.');
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
  } catch (x) {
    ih(c, `<div class="yt-ai-error-msg">Failed: ${x.message}</div>`);
  }
}
async function getConfig() {
  try {
    const r = await sg('config');
    return r.config || {};
  } catch (e) {
    return {};
  }
}
function scrollBackToTop(sn = true) {
  l('[CR] Scroll top');
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  void document.body.offsetHeight;
  requestAnimationFrame(() => {
    if (window.scrollY > 0) {
      w('[CR] Scroll fail, retry');
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    l('[CR] Final scroll:', window.scrollY);
  });
  if (sn) showScrollNotification();
}
function showScrollNotification() {
  const n = ce('div');
  n.id = 'yt-ai-scroll-notification';
  tc(n, '⬆️ Scrolled to top');
  n.style.cssText =
    "position:fixed;top:80px;right:20px;background:#3ea6ff;color:white;padding:12px 20px;border-radius:8px;font-family:'Roboto',Arial,sans-serif;font-size:14px;font-weight:500;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:slideIn 0.3s ease-out;";
  ap(doc.body, n);
  st(() => {
    n.style.animation = 'slideOut 0.3s ease-in';
    st(() => n.remove(), 300);
  }, 2000);
}
