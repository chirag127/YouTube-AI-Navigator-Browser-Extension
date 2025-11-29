import { state } from '../core/state.js';
import { renderSummary } from './renderers/summary.js';
import { renderTranscript } from './renderers/transcript.js';
import { renderSegments } from './renderers/segments.js';
import { renderChat } from './renderers/chat.js';
import { renderComments } from './renderers/comments.js';
import { qs as $, qsa as $$, id as ge, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';

export function initTabs(c) {
  $$('.yt-ai-tab', c).forEach(t => on(t, 'click', () => switchTab(t.dataset.tab, c)));
}

export function switchTab(n, container) {
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
      case 'transcript':
        renderTranscript(a, state.currentTranscript || []);
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
    e('Error switching tab:', x);
    a.innerHTML = `<div class="yt-ai-error">Error loading tab content</div>`;
  }
}
