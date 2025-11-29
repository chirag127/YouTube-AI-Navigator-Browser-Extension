const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { getVideoElement } = await import(gu('content/utils/dom.js'));
const { qs: $, ce } = await import(gu('utils/shortcuts/dom.js'));
export function injectSegmentMarkers(s) {
  l('injectSegmentMarkers:Start');
  try {
    if (!s?.length) return;
    const p = $('.ytp-progress-bar');
    if (!p) return;
    const ex = $('#yt-ai-markers');
    if (ex) ex.remove();
    const c = ce('div');
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
        m = ce('div');
      m.style.cssText = `position:absolute;left:${st}%;width:${w}%;height:100%;background:${getSegmentColor(x.label)};opacity:0.6;`;
      m.title = x.label;
      c.appendChild(m);
    });
    p.appendChild(c);
    l('injectSegmentMarkers:End');
  } catch (err) {
    e('Err:injectSegmentMarkers', err);
  }
}
function getSegmentColor(l) {
  l('getSegmentColor:Start');
  try {
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
    const result = c[l] || '#999999';
    l('getSegmentColor:End');
    return result;
  } catch (err) {
    e('Err:getSegmentColor', err);
    return '#999999';
  }
}
