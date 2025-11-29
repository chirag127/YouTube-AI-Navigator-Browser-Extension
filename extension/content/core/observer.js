const gu = p => chrome.runtime.getURL(p);

const { state, resetState } = await import(gu('content/core/state.js'));
const { injectWidget } = await import(gu('content/ui/widget.js'));
const { isWidgetProperlyVisible } = await import(gu('content/utils/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { ct } = await import(gu('utils/shortcuts/core.js'));
const { to: st } = await import(gu('utils/shortcuts/global.js'));
const { on: ae, qs, mo } = await import(gu('utils/shortcuts/dom.js'));

let lastUrl = location.href;
let dt = null;

export function initObserver() {
  l('initObserver:Start');
  try {
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
    l('initObserver:End');
  } catch (err) {
    e('Err:initObserver', err);
  }
}

async function handleNewVideo(v) {
  l('handleNewVideo:Start');
  try {
    if (v !== state.currentVideoId) {
      state.currentVideoId = v;
      resetState();
    }
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
          e('Err:handleNewVideo:analysis', err);
        }
      }, 1500);
    }
    l('handleNewVideo:End');
  } catch (x) {
    e('Err:handleNewVideo', x);
  }
}

function checkCurrentPage() {
  l('checkCurrentPage:Start');
  try {
    if (location.pathname === '/watch') {
      const u = new URLSearchParams(location.search),
        v = u.get('v');
      if (v) {
        const w = qs('#yt-ai-master-widget');
        if (v === state.currentVideoId && isWidgetProperlyVisible(w)) {
          l('checkCurrentPage:End');
          return;
        }
        handleNewVideo(v);
      }
    }
    l('checkCurrentPage:End');
  } catch (err) {
    e('Err:checkCurrentPage', err);
  }
}
