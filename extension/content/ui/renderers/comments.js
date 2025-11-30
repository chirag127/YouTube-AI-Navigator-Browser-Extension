import { gu } from '../../../utils/shortcuts/runtime.js';

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
      // Wrap existing analysis in glass card
      ih(
        c,
        `
        <div class="yt-ai-card glass-panel" style="animation: slideUpFade 0.4s var(--ease-fluid)">
          <h3 class="yt-ai-card-title">💬 Comment Sentiment Analysis</h3>
          <div class="yt-ai-card-content">${html}</div>
        </div>
      `
      );
      return;
    }

    showLoading(c, 'Loading comments section...');
    const cfg = await getConfig();
    const origPos = window.scrollY;
    const retries = cfg.comments?.retries ?? 10;

    await forceLoadComments();
    showLoading(c, 'Waiting for comments...');
    await to(() => {}, 800);

    try {
      const cm = await getComments(retries);
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

        // Render with Liquid Glass Design
        const topCommentsHtml = jn(
          mp(
            slc(cm, 0, 5),
            (x, i) => `
              <div class="yt-ai-comment glass-panel-sub" style="animation: slideUpFade 0.3s var(--ease-fluid) ${0.1 + i * 0.05}s backwards; margin-bottom: 8px; padding: 12px; border-radius: var(--radius-md);">
                <div class="yt-ai-comment-header" style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85em; opacity: 0.8;">
                  <span class="yt-ai-comment-author" style="font-weight: 600; color: var(--accent);">${x.author}</span>
                  <span class="yt-ai-comment-likes">👍 ${x.likes}</span>
                </div>
                <div class="yt-ai-comment-text" style="font-size: 0.95em; line-height: 1.4;">${x.text}</div>
              </div>
            `
          ),
          ''
        );

        ih(
          c,
          `
            <div class="yt-ai-comments-container" style="display: flex; flex-direction: column; gap: 16px; padding: 8px 0;">
              <div class="yt-ai-card glass-panel" style="animation: slideUpFade 0.4s var(--ease-fluid)">
                <h3 class="yt-ai-card-title">💬 Comment Sentiment Analysis</h3>
                <div class="yt-ai-card-content">${html}</div>
              </div>

              <div class="yt-ai-card glass-panel" style="animation: slideUpFade 0.4s var(--ease-fluid) 0.1s backwards">
                <h4 class="yt-ai-card-title" style="font-size: 1em; margin-bottom: 12px;">Top Comments (${cm.length})</h4>
                <div class="yt-ai-card-content">
                  ${topCommentsHtml}
                </div>
              </div>
            </div>
          `
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

      // Poll for comments to appear
      let attempts = 0;
      const maxAttempts = 20; // 20 * 500ms = 10 seconds

      while (attempts < maxAttempts) {
        await to(() => {}, 500);

        // Check if comments have loaded
        const comments = doc.querySelectorAll('ytd-comment-thread-renderer, ytd-comment-renderer');
        if (comments && comments.length > 0) {
          // Comments appeared! Give a tiny bit more time for text to render
          await to(() => {}, 500);
          return;
        }

        // Check for spinner (still loading)
        // const spinner = doc.querySelector('ytd-item-section-renderer #spinner');

        // Check for "disabled" message to exit early
        const msg = doc.querySelector('ytd-comments-header-renderer #message');
        if (msg && msg.textContent.toLowerCase().includes('turned off')) {
          return; // Comments disabled, stop waiting
        }

        // If we are at the bottom, maybe scroll up a bit to trigger lazy load
        if (attempts % 5 === 0) {
          window.scrollBy(0, -50);
          await to(() => {}, 100);
          window.scrollBy(0, 50);
        }

        attempts++;
      }
      return;
    }

    // Fallback if no comments section found (e.g. mobile/other layout)
    window.scrollTo({ top: doc.documentElement.scrollHeight, behavior: 'smooth' });
    await to(() => {}, 2000);
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
    // Updated style to match Neo-Brutalist/Glass aesthetic
    n.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--accent, #3ea6ff);
      color: #000;
      padding: 12px 20px;
      border-radius: var(--radius-md, 8px);
      font-family: var(--font-display, 'Outfit', sans-serif);
      font-size: 14px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: var(--brutal-shadow, 4px 4px 0px rgba(0,0,0,0.5));
      border: 2px solid #000;
      animation: slideIn 0.3s var(--ease-fluid, ease-out);
    `;
    ap(doc.body, n);
    to(() => {
      n.style.animation = 'slideOut 0.3s ease-in';
      to(() => n.remove(), 300);
    }, 2000);
  } catch (err) {
    e('Err:showScrollNotification', err);
  }
}
