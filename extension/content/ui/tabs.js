const gu = p => chrome.runtime.getURL(p);

const { state } = await import(gu('content/core/state.js'));
const { renderSummary } = await import(gu('content/ui/renderers/summary.js'));

const { renderSegments } = await import(gu('content/ui/renderers/segments.js'));
const { renderChat } = await import(gu('content/ui/renderers/chat.js'));
const { renderComments } = await import(gu('content/ui/renderers/comments.js'));
const { qs: $, qsa: $$, id: ge, on } = await import(gu('utils/shortcuts/dom.js'));
const { e } = await import(gu('utils/shortcuts/log.js'));

export function initTabs(c) {
  try {
    $$('.yt-ai-tab', c).forEach(t => on(t, 'click', () => switchTab(t.dataset.tab, c)));
  } catch (err) {
    e('Err:initTabs', err);
  }
}

export function switchTab(n, container) {
  try {
    const c = container || ge('yt-ai-master-widget');
    if (!c) return;
    $$('.yt-ai-tab', c).forEach(t => t.classList.remove('active'));
    $(`[data-tab="${n}"]`, c)?.classList.add('active');
    const i = $('#yt-ai-chat-input-area', c);
    if (i) i.style.display = n === 'chat' ? 'flex' : 'none';
    const a = $('#yt-ai-content-area', c);
    if (!a) return;
    try {
      switch (n) {
        case 'summary':
          renderSummary(a, state.analysisData || {});
          break;

        case 'segments':
          renderSegments(a, state.analysisData || {});
          break;
        case 'chat':
          renderChat(a);
          break;
        case 'comments':
          renderComments(a);
          break;
      }
    } catch (x) {
      e('Err:switchTab', x);
      a.innerHTML = `<div class="yt-ai-error">Error loading tab content</div>`;
    }
  } catch (err) {
    e('Err:switchTab', err);
  }
}
