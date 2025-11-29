import { state, resetState } from './state.js';
import { injectWidget } from '../ui/widget.js';
import { startAnalysis } from './analyzer.js';
import { log, logError } from './debug.js';
import { isWidgetProperlyVisible } from '../utils/dom.js';
import { st, cst, ge, on, loc } from '../../utils/shortcuts.js';

let lastUrl = loc.href;
let dt = null;

export function initObserver() {
  log('Initializing observer...');
  const uo = new MutationObserver(() => {
    if (loc.href !== lastUrl) {
      lastUrl = loc.href;
      log('URL changed:', lastUrl);
      if (dt) cst(dt);
      dt = st(() => checkCurrentPage(), 300);
    }
  });
  on(document, 'yt-navigate-finish', () => {
    log('YouTube navigation finished');
    if (dt) cst(dt);
    dt = st(() => checkCurrentPage(), 500);
  });
  const o = new MutationObserver(() => {
    if (loc.pathname !== '/watch') return;
    const u = new URLSearchParams(loc.search),
      v = u.get('v');
    const w = ge('yt-ai-master-widget');
    if ((v && v !== state.currentVideoId) || (v && !isWidgetProperlyVisible(w))) {
      if (dt) cst(dt);
      dt = st(() => handleNewVideo(v), 300);
    }
  });
  uo.observe(document.body, { childList: true, subtree: true });
  o.observe(document.body, { childList: true, subtree: true });
  log('Observer started');
  checkCurrentPage();
}

async function handleNewVideo(v) {
  log('New video detected or widget missing:', v);
  if (v !== state.currentVideoId) {
    state.currentVideoId = v;
    resetState();
  }
  try {
    await injectWidget();
    log('Widget injected successfully');
    st(() => {
      const w = ge('yt-ai-master-widget');
      if (w && w.parentElement) {
        const p = w.parentElement;
        if (p.firstChild !== w) {
          log('Widget not at top after injection, correcting...');
          p.insertBefore(w, p.firstChild);
        }
      }
    }, 500);
    if (state.settings.autoAnalyze) st(() => startAnalysis(), 1500);
  } catch (e) {
    logError('Widget injection failed', e);
  }
}

function checkCurrentPage() {
  log('Checking current page...');
  if (loc.pathname === '/watch') {
    const u = new URLSearchParams(loc.search),
      v = u.get('v');
    if (v) {
      const w = ge('yt-ai-master-widget');
      if (v === state.currentVideoId && isWidgetProperlyVisible(w)) {
        log('Same video and widget is properly visible, skipping re-initialization:', v);
        return;
      }
      log('Video page detected (New ID or Widget Not Properly Visible):', v);
      handleNewVideo(v);
    } else log('No video ID found in URL');
  } else log('Not on video page:', loc.pathname);
}
