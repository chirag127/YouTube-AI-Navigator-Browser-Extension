import { showPlaceholder } from '../components/loading.js';
import { seekVideo } from '../../utils/dom.js';
import { formatTime } from '../../utils/time.js';
import { id as ge, on, qs as $, qsa as $$ } from '../../utils/shortcuts/dom.js';
import { l } from '../../utils/shortcuts/log.js';

let autoCloseEnabled = true;

export function renderTranscript(c, s) {
  if (!s?.length) {
    showPlaceholder(c, 'No transcript available.');
    return;
  }
  const h = s
    .map(
      x =>
        `<div class="yt-ai-segment" data-time="${x.start}"><span class="yt-ai-timestamp">${formatTime(x.start)}</span><span class="yt-ai-text">${x.text}</span></div>`
    )
    .join('');
  const ab = `<div class="yt-ai-transcript-controls"><button id="yt-ai-transcript-autoclose-toggle" class="yt-ai-btn-small ${autoCloseEnabled ? 'active' : ''}">${autoCloseEnabled ? '✓' : '✗'} Auto-close after extraction</button></div>`;
  c.innerHTML = `${ab}<div class="yt-ai-transcript-list">${h}</div>`;
  $$('.yt-ai-segment', c).forEach(e => on(e, 'click', () => seekVideo(parseFloat(e.dataset.time))));
  const tb = $('#yt-ai-transcript-autoclose-toggle', c);
  if (tb) {
    on(tb, 'click', () => {
      autoCloseEnabled = !autoCloseEnabled;
      tb.classList.toggle('active', autoCloseEnabled);
      tb.textContent = `${autoCloseEnabled ? '✓' : '✗'} Auto-close after extraction`;
      l(`[Transcript] Auto-close ${autoCloseEnabled ? 'enabled' : 'disabled'}`);
    });
  }
}

export function shouldAutoClose() {
  return autoCloseEnabled;
}

export function collapseTranscriptWidget() {
  const w = ge('yt-ai-master-widget');
  if (w && autoCloseEnabled) {
    l('[Transcript] Auto-closing widget after extraction');
    w.classList.add('yt-ai-collapsed');
    const cb = $('#yt-ai-close-btn', w);
    if (cb) {
      cb.textContent = '⬇️';
      cb.title = 'Expand';
    }
  }
}
