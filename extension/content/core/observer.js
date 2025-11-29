import { state, resetState } from './state.js';
import { injectWidget } from '../ui/widget.js';
import { isWidgetProperlyVisible } from '../utils/dom.js';
import { err as e, to as st, ct } from '../../utils/shortcuts/core.js';
import { on as ae, qs, mo } from '../../utils/shortcuts/dom.js';

let lastUrl = location.href;
let dt = null;

export function initObserver() {
  const uo = mo(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (dt) ct(dt);
      dt = st(() => checkCurrentPage(), 300);
    }
  });
  ae(document, 'yt-navigate-finish', () => {
    if (dt) ct(dt);
    dt = st(() => checkCurrentPage(), 500);
  });
  const o = mo(() => {
    if (location.pathname !== '/watch') return;
    const u = new URLSearchParams(location.search),
      v = u.get('v');
    const w = qs('#yt-ai-master-widget');
    if ((v && v !== state.currentVideoId) || (v && !isWidgetProperlyVisible(w))) {
      if (dt) ct(dt);
      dt = st(() => handleNewVideo(v), 300);
    }
  });
  uo.observe(document.body, { childList: true, subtree: true });
  o.observe(document.body, { childList: true, subtree: true });
  checkCurrentPage();
}

async function handleNewVideo(v) {
  if (v !== state.currentVideoId) {
    state.currentVideoId = v;
    resetState();
  }
  try {
    await injectWidget();
    st(() => {
      const w = qs('#yt-ai-master-widget');
      if (w && w.parentElement) {
        const p = w.parentElement;
        if (p.firstChild !== w) {
          p.insertBefore(w, p.firstChild);
        }
      }
    }, 500);
    if (state.settings.autoAnalyze) {
      st(async () => {
        try {
          const { startAnalysis } = await import('./analyzer.js');
          startAnalysis();
        } catch (err) {
          e('Analysis start fail', err);
        }
      }, 1500);
    }
  } catch (x) {
    e('Widget inj fail', x);
  }
}

function checkCurrentPage() {
  if (location.pathname === '/watch') {
    const u = new URLSearchParams(location.search),
      v = u.get('v');
    if (v) {
      const w = qs('#yt-ai-master-widget');
      if (v === state.currentVideoId && isWidgetProperlyVisible(w)) {
        return;
      }
      handleNewVideo(v);
    }
  }
}
