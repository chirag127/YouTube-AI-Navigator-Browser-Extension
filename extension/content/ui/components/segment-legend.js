import { oe } from '../../../utils/shortcuts/core.js';
import { mp, jn } from '../../../utils/shortcuts/array.js';
import { id as ge, ce } from '../../../utils/shortcuts/dom.js';

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

export const renderLegend = () => {
  const h = jn(
    mp(
      oe(colors),
      ([l, c]) =>
        `<div class="seg-legend-item"><span class="seg-color" style="background:${c}"></span><span>${l}</span></div>`
    ),
    ''
  );
  return `<div class="seg-legend"><div class="seg-legend-title">Segment Types</div>${h}</div>`;
};

export const injectLegendStyles = () => {
  if (ge('yt-ai-legend-styles')) return;
  const s = ce('style');
  s.id = 'yt-ai-legend-styles';
  s.textContent = `.seg-legend{margin:10px 0;padding:10px;background:#0f0f0f;border-radius:8px}.seg-legend-title{font-weight:600;margin-bottom:8px;font-size:13px}.seg-legend-item{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:12px}.seg-color{width:16px;height:16px;border-radius:3px;display:inline-block}`;
  document.head.appendChild(s);
};
