import { gu } from '../../../utils/shortcuts/runtime.js';
import { isa } from '../../../utils/shortcuts/array.js';

const { e } = await import(gu('utils/shortcuts/log.js'));
const { showPlaceholder } = await import(gu('content/ui/components/loading.js'));

const { seekVideo } = await import(gu('content/utils/dom.js'));
const { formatTime } = await import(gu('content/utils/time.js'));
const { qs, ae, qsa: $ } = await import(gu('utils/shortcuts/dom.js'));
const { CM: colors, LM } = await import(gu('utils/shortcuts/segments.js'));
export function renderSegments(c, data) {
  try {
    const s = isa(data) ? data : data?.segments || [];
    const fl = !isa(data) ? data?.fullVideoLabel : null;
    const b = qs('#yt-ai-full-video-label');
    if (b) {
      if (fl) {
        b.textContent = LM[fl] || fl;
        b.style.display = 'inline-block';
        b.style.backgroundColor = colors[fl] || '#999';
        b.style.color = '#000';
        b.style.marginLeft = '8px';
        b.style.fontSize = '0.8em';
        b.style.padding = '2px 6px';
        b.style.borderRadius = '4px';
      } else b.style.display = 'none';
    }
    if (!s?.length) {
      showPlaceholder(c, 'No segments detected.');
      return;
    }
    const h = s
      .map(x => {
        const cl = colors[x.label] || '#999';
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
        return `<div class="yt-ai-segment-item" style="border-left:4px solid ${cl}"><div class="yt-ai-segment-label">${LM[x.label] || x.label}</div><div class="yt-ai-segment-time">${th}</div>${x.title ? `<div class="yt-ai-segment-title">${x.title}</div>` : ''}<div class="yt-ai-segment-desc">${x.description || x.text || ''}</div></div>`;
      })
      .join('');
    c.innerHTML = `<div class="yt-ai-segments-list">${h}</div>`;
    $('.yt-ai-timestamp', c).forEach(e => {
      e.style.cursor = 'pointer';
      e.style.textDecoration = 'underline';
      ae(e, 'click', evt => {
        evt.stopPropagation();
        seekVideo(parseFloat(e.dataset.time));
      });
    });
  } catch (err) {
    e('Err:renderSegments', err);
  }
}
