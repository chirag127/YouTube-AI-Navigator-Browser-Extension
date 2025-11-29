import { getVideoElement } from '../utils/dom.js';
import { id as i, qs as $ } from '../../utils/shortcuts/dom.js';
import { rt as cr } from '../../utils/shortcuts/runtime.js';

export function injectSegmentMarkers(s) {
  if (!s?.length) return;
  const p = $('.ytp-progress-bar');
  if (!p) return;
  const e = i('yt-ai-markers');
  if (e) e.remove();
  const c = cr('div');
  c.id = 'yt-ai-markers';
  c.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:30;';
  const v = getVideoElement(),
    d = v?.duration || 0;
  if (!d) return;
  s.forEach(x => {
    if (x.label === 'Content') return;
    const st = (x.start / d) * 100,
      w = ((x.end - x.start) / d) * 100,
      m = cr('div');
    m.style.cssText = `position:absolute;left:${st}%;width:${w}%;height:100%;background:${getSegmentColor(x.label)};opacity:0.6;`;
    m.title = x.label;
    c.appendChild(m);
  });
  p.appendChild(c);
}

function getSegmentColor(l) {
  const c = {
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
  return c[l] || '#999999';
}
