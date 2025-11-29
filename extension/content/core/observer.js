import { state, resetState } from './state.js';
import { injectWidget } from '../ui/widget.js';
import { startAnalysis } from './analyzer.js';
import { isWidgetProperlyVisible } from '../utils/dom.js';
import { log as l, err as e, st, ct as co, loc } from '../../utils/shortcuts/core.js';
import { on, id } from '../../utils/shortcuts/dom.js';

let lastUrl = st.loc.href;
let dt = null;

export function initObserver() {
  l('Initializing observer...');
  const uo = new MutationObserver(() => {
    if (loc.href !== lastUrl) {
      lastUrl = loc.href;
      l('URL changed:', lastUrl);
      if (dt) co(dt);
      dt = st(() => checkCurrentPage(), 300);
    }
  });
  on(document, 'yt-navigate-finish', () => {
    l('YouTube navigation finished');
    if (dt) co(dt);
    dt = st(() => checkCurrentPage(), 500);
  });
  const o = new MutationObserver(() => {
    if (loc.pathname !== '/watch') return;
    const u = new URLSearchParams(loc.search),
      v = u.get('v');
    const w = id('yt-ai-master-widget');
    if ((v && v !== state.currentVideoId) || (v && !isWidgetProperlyVisible(w))) {
      if (dt) co(dt);
      dt = st(() => handleNewVideo(v), 300);
    }
  });
  uo.observe(document.body, { childList: true, subtree: true });
  o.observe(document.body, { childList: true, subtree: true });
  l('Observer started');
  checkCurrentPage();
}

async function handleNewVideo(v) {
  l('New video detected or widget missing:', v);
  if (v !== state.currentVideoId) {
    state.currentVideoId = v;
    resetState();
  }
  try {
    await injectWidget();
    l('Widget injected successfully');
    st(() => {
      const w = id('yt-ai-master-widget');
      if (w && w.parentElement) {
        const p = w.parentElement;
        if (p.firstChild !== w) {
          l('Widget not at top after injection, correcting...');
          p.insertBefore(w, p.firstChild);
        }
      }
    }, 500);
    if (state.settings.autoAnalyze) st(() => startAnalysis(), 1500);
  } catch (x) {
    e('Widget injection failed', x);
  }
}

function checkCurrentPage() {
  l('Checking current page...');
  if (loc.pathname === '/watch') {
    const u = new URLSearchParams(loc.search),
      v = u.get('v');
    if (v) {
      const w = id('yt-ai-master-widget');
      if (v === state.currentVideoId && isWidgetProperlyVisible(w)) {
        l('Same video and widget is properly visible, skipping re-initialization:', v);
        return;
      }
      l('Video page detected (New ID or Widget Not Properly Visible):', v);
      handleNewVideo(v);
    } else l('No video ID found in URL');
  } else l('Not on video page:', loc.pathname);
}
