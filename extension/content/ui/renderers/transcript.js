const gu = p => chrome.runtime.getURL(p);

const { showPlaceholder } = await import(gu('content/ui/components/loading.js'));
const { seekVideo } = await import(gu('content/utils/dom.js'));
const { formatTime } = await import(gu('content/utils/time.js'));
const { id: ge, on, qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
let autoCloseEnabled = true;
export function renderTranscript(c, s) {
  l('renderTranscript:Start');
  try {
    if (!s?.length) {
      showPlaceholder(c, 'No transcript available.');
      l('renderTranscript:End');
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
    $$('.yt-ai-segment', c).forEach(e =>
      on(e, 'click', () => seekVideo(parseFloat(e.dataset.time)))
    );
    const tb = $('#yt-ai-transcript-autoclose-toggle', c);
    if (tb) {
      on(tb, 'click', () => {
        autoCloseEnabled = !autoCloseEnabled;
        tb.classList.toggle('active', autoCloseEnabled);
        tb.textContent = `${autoCloseEnabled ? '✓' : '✗'} Auto-close after extraction`;
        l(`[Transcript] Auto-close ${autoCloseEnabled ? 'enabled' : 'disabled'}`);
      });
    }
    l('renderTranscript:End');
  } catch (err) {
    e('Err:renderTranscript', err);
  }
}
export function shouldAutoClose() {
  l('shouldAutoClose:Start');
  try {
    l('shouldAutoClose:End');
    return autoCloseEnabled;
  } catch (err) {
    e('Err:shouldAutoClose', err);
    return false;
  }
}
export function collapseTranscriptWidget() {
  l('collapseTranscriptWidget:Start');
  try {
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
    l('collapseTranscriptWidget:End');
  } catch (err) {
    e('Err:collapseTranscriptWidget', err);
  }
}
