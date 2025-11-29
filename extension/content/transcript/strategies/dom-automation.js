import { gu } from '../../../../utils/shortcuts/runtime.js';
import { af } from '../../../../utils/shortcuts/array.js';

const { qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { log: l, err: e, dbg: d, nw, tr } = await import(gu('utils/shortcuts/core.js'));
const { st: to } = await import(gu('utils/shortcuts/time.js'));
export const name = 'DOM Automation';
export const priority = 10;

export const extract = async vid => {
  l(`[DOM Automation] Starting for ${vid}...`);
  try {
    let tc = $(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
    );
    if (!isVis(tc)) {
      d('[DOM Automation] Panel hidden, opening...');
      await openPanel();
    } else d('[DOM Automation] Panel visible');
    await waitSeg();
    const s = scrape();
    if (!s || s.length === 0) throw new Error('No segments found');
    l(`[DOM Automation] Scraped ${s.length} segments`);
    return s;
  } catch (x) {
    e('[DOM Automation] Failed:', x.message);
    throw x;
  }
};

const isVis = c => c && c.visibility !== 'hidden' && c.offsetParent !== null;

const openPanel = async () => {
  const eb = $('#expand');
  if (eb && eb.offsetParent !== null) {
    eb.click();
    await wait(500);
  }
  const sels = [
    'button[aria-label="Show transcript"]',
    'ytd-button-renderer[aria-label="Show transcript"]',
    '#primary-button button[aria-label="Show transcript"]',
  ];
  let stb = null;
  for (const s of sels) {
    stb = $(s);
    if (stb) break;
  }
  if (!stb) {
    const btns = af($$('button, ytd-button-renderer'));
    stb = btns.find(b => b.textContent.includes('Show transcript'));
  }
  if (stb) {
    stb.click();
    await wait(1000);
  } else throw new Error('Show transcript button not found');
};

const waitSeg = async (t = 5000) => {
  const s = nw();
  while (nw() - s < t) {
    const el = $('ytd-transcript-segment-renderer');
    if (el) return;
    await wait(500);
  }
  throw new Error('Timeout waiting for segments');
};

const scrape = () => {
  const ses = $$('ytd-transcript-segment-renderer');
  const s = [];
  ses.forEach(el => {
    const tse = el.querySelector('.segment-timestamp');
    const te = el.querySelector('.segment-text');
    if (tse && te) {
      const ts = tr(tse.textContent);
      const t = tr(te.textContent);
      const st = parseTs(ts);
      s.push({ start: st, text: t, duration: 0 });
    }
  });
  for (let i = 0; i < s.length; i++) {
    if (i < s.length - 1) s[i].duration = s[i + 1].start - s[i].start;
    else s[i].duration = 5;
  }
  return s;
};

const parseTs = s => {
  const p = s.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  else if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
};

const wait = ms => new Promise(r => to(r, ms));
