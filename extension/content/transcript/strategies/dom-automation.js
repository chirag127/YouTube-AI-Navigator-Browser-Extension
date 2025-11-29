import { gu } from '../../../utils/shortcuts/runtime.js';

const { qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { stt: to } = await import(gu('utils/shortcuts/time.js'));
export const name = 'DOM Automation';
export const priority = 10;

export const extract = async vid => {
  l('extract:Start');
  try {
    l(`[DOM Automation] Starting for ${vid}...`);
    let tc = $(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
    );
    if (!isVis(tc)) {
      l('[DOM Automation] Panel hidden, opening...');
      await openPanel();
    } else l('[DOM Automation] Panel visible');
    await waitSeg();
    const s = scrape();
    if (!s || s.length === 0) throw new Error('No segments found');
    l(`[DOM Automation] Scraped ${s.length} segments`);
    l('extract:End');
    return s;
  } catch (x) {
    e('Err:extract', x);
    throw x;
  }
};

const isVis = c => {
  l('isVis:Start');
  try {
    const result = c && c.visibility !== 'hidden' && c.offsetParent !== null;
    l('isVis:End');
    return result;
  } catch (err) {
    e('Err:isVis', err);
    return false;
  }
};

const openPanel = async () => {
  l('openPanel:Start');
  try {
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
      const btns = $$('button, ytd-button-renderer');
      stb = Array.from(btns).find(b => b.textContent.includes('Show transcript'));
    }
    if (stb) {
      stb.click();
      await wait(1000);
      l('openPanel:End');
    } else throw new Error('Show transcript button not found');
  } catch (err) {
    e('Err:openPanel', err);
    throw err;
  }
};

const waitSeg = async (t = 5000) => {
  l('waitSeg:Start');
  try {
    const s = nw();
    while (nw() - s < t) {
      const el = $('ytd-transcript-segment-renderer');
      if (el) {
        l('waitSeg:End');
        return;
      }
      await wait(500);
    }
    throw new Error('Timeout waiting for segments');
  } catch (err) {
    e('Err:waitSeg', err);
    throw err;
  }
};

const scrape = () => {
  l('scrape:Start');
  try {
    const ses = $$('ytd-transcript-segment-renderer');
    const s = [];
    Array.from(ses).forEach(el => {
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
    l('scrape:End');
    return s;
  } catch (err) {
    e('Err:scrape', err);
    return [];
  }
};

const parseTs = s => {
  l('parseTs:Start');
  try {
    const p = s.split(':').map(Number);
    let result = 0;
    if (p.length === 3) result = p[0] * 3600 + p[1] * 60 + p[2];
    else if (p.length === 2) result = p[0] * 60 + p[1];
    l('parseTs:End');
    return result;
  } catch (err) {
    e('Err:parseTs', err);
    return 0;
  }
};

const wait = ms => {
  l('wait:Start');
  try {
    const result = new Promise(r => to(r, ms));
    l('wait:End');
    return result;
  } catch (err) {
    e('Err:wait', err);
    return Promise.resolve();
  }
};
