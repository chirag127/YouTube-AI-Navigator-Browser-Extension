const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { qs: $, ce } = await import(gu('utils/shortcuts/dom.js'));
const colors = {
  Sponsor: '#00d26a',
  'Self Promotion': '#ffff00',
  'Unpaid/Self Promotion': '#ffff00',
  'Exclusive Access': '#008b45',
  'Interaction Reminder (Subscribe)': '#a020f0',
  Highlight: '#ff0055',
  'Intermission/Intro Animation': '#00ffff',
  'Endcards/Credits': '#0000ff',
  'Preview/Recap': '#00bfff',
  'Hook/Greetings': '#4169e1',
  'Tangents/Jokes': '#9400d3',
};
export const renderTimeline = (segs, dur) => {
  try {
    const bar = $('.ytp-progress-bar-container');
    if (!bar) return;
    const ex = $('#yt-ai-timeline-markers');
    if (ex) ex.remove();
    const c = ce('div');
    c.id = 'yt-ai-timeline-markers';
    c.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:40';
    segs.forEach(s => {
      const m = ce('div');
      const left = (s.start / dur) * 100,
        w = ((s.end - s.start) / dur) * 100;
      m.style.cssText = `position:absolute;left:${left}%;width:${w}%;height:100%;background:${colors[s.label] || '#fff'};opacity:0.6;pointer-events:auto;cursor:pointer`;
      m.title = `${s.label}: ${s.description}`;
      m.onclick = () => {
        const v = $('video');
        if (v) v.currentTime = s.start;
      };
      c.appendChild(m);
    });
    bar.appendChild(c);
  } catch (err) {
    e('Err:renderTimeline', err);
  }
};
export const clearTimeline = () => {
  try {
    const ex = $('#yt-ai-timeline-markers');
    if (ex) ex.remove();
  } catch (err) {
    e('Err:clearTimeline', err);
  }
};
