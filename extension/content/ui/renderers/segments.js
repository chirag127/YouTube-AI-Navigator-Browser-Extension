import { gu } from '../../../utils/shortcuts/runtime.js';
import { isa } from '../../../utils/shortcuts/array.js';

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { showPlaceholder } = await import(gu('content/ui/components/loading.js'));

const { seekVideo } = await import(gu('content/utils/dom.js'));
const { formatTime } = await import(gu('content/utils/time.js'));
const { qs, ae, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const colors = {
  Sponsor: '#00d26a',
  'Self Promotion': '#ffff00',
  'Unpaid Promotion': '#ff8800',
  'Exclusive Access': '#008b45',
  'Interaction Reminder (Subscribe)': '#a020f0',
  Highlight: '#ff0055',
  'Intermission/Intro Animation': '#00ffff',
  'Endcards/Credits': '#0000ff',
  'Preview/Recap': '#00bfff',
  'Hook/Greetings': '#4169e1',
  'Tangents/Jokes': '#9400d3',
};
export function renderSegments(c, data) {
  l('renderSegments:Start');
  try {
    const s = isa(data) ? data : data?.segments || [];
    const fl = !isa(data) ? data?.fullVideoLabel : null;
    const b = qs('#yt-ai-full-video-label');
    if (b) {
      if (fl) {
        b.textContent = fl;
        b.style.display = 'inline-block';
        b.style.backgroundColor = colors[fl] || '#444';
        b.style.color = '#000';
        b.style.marginLeft = '8px';
        b.style.fontSize = '0.8em';
        b.style.padding = '2px 6px';
        b.style.borderRadius = '4px';
      } else b.style.display = 'none';
    }
    if (!s?.length) {
      showPlaceholder(c, 'No segments detected.');
      l('renderSegments:End');
      return;
    }
    const h = s
      .map(x => {
        const cl = colors[x.label] || '#fff';
        const ts = x.timestamps || [
          { type: 'start', time: x.start },
          { type: 'end', time: x.end },
        ];
        const th = ts
          .map(
            t =>
              `<span class="yt-ai-timestamp" data-time="${t.time}" title="Click to seek to ${formatTime(t.time)}">${formatTime(t.time)}</span>`
          )
          .join(' - ');
        return `<div class="yt-ai-segment-item" style="border-left:4px solid ${cl}"><div class="yt-ai-segment-label">${x.label}</div><div class="yt-ai-segment-time">${th}</div>${x.title ? `<div class="yt-ai-segment-title">${x.title}</div>` : ''}<div class="yt-ai-segment-desc">${x.description || x.text || ''}</div></div>`;
      })
      .join('');
    c.innerHTML = `<div class="yt-ai-segments-list">${h}</div>`;
    $$('.yt-ai-timestamp', c).forEach(e => {
      e.style.cursor = 'pointer';
      e.style.textDecoration = 'underline';
      ae(e, 'click', evt => {
        evt.stopPropagation();
        seekVideo(parseFloat(e.dataset.time));
      });
    });
    l('renderSegments:End');
  } catch (err) {
    e('Err:renderSegments', err);
  }
}
