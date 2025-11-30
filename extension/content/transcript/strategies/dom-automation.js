
import { $, $$ } from '../../../utils/shortcuts/dom.js';
import { e } from '../../../utils/shortcuts/log.js';
import { getCfg } from '../../../utils/config.js';
import { stt as to } from '../../../utils/shortcuts/time.js';
import { now as nw } from '../../../utils/shortcuts/core.js';
import { trm } from '../../../utils/shortcuts/string.js';

export const name = 'DOM Automation';
export const priority = 10;

export const extract = async () => {
  try {
    const cfg = await getCfg().load();
    const autoScroll = cfg.tr?.as ?? true;
    const initialScroll = window.scrollY;

    let tc = $(
      'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]'
    );
    const wasOpen = isVis(tc);
    if (!wasOpen) {
      await openPanel();
    }
    await waitSeg();
    const s = scrape();
    if (!s || s.length === 0) throw new Error('No segments found');
    if (!wasOpen) {
      await closePanel();
    }

    if (autoScroll) {
      window.scrollTo({ top: initialScroll, behavior: 'smooth' });
    }

    return s;
  } catch (x) {
    e('Err:extract', x);
    throw x;
  }
};
const closePanel = async () => {
  try {
    const cb = $('button[aria-label="Close transcript"]');
    if (cb) {
      cb.click();
      await wait(300);
    }
  } catch (err) {
    e('Err:closePanel', err);
  }
};

const isVis = c => {
  try {
    return c && c.visibility !== 'hidden' && c.offsetParent !== null;
  } catch (err) {
    e('Err:isVis', err);
    return false;
  }
};

const openPanel = async () => {
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
    } else throw new Error('Show transcript button not found');
  } catch (err) {
    e('Err:openPanel', err);
    throw err;
  }
};

const waitSeg = async (t = 5000) => {
  try {
    const s = nw();
    while (nw() - s < t) {
      const el = $('ytd-transcript-segment-renderer');
      if (el) {
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
  try {
    const ses = $$('ytd-transcript-segment-renderer');
    const s = [];
    Array.from(ses).forEach(el => {
      const tse = el.querySelector('.segment-timestamp');
      const te = el.querySelector('.segment-text');
      if (tse && te) {
        const ts = trm(tse.textContent);
        const t = trm(te.textContent);
        const st = parseTs(ts);
        s.push({ start: st, text: t, duration: 0 });
      }
    });
    for (let i = 0; i < s.length; i++) {
      if (i < s.length - 1) s[i].duration = s[i + 1].start - s[i].start;
      else s[i].duration = 5;
    }
    return s;
  } catch (err) {
    e('Err:scrape', err);
    return [];
  }
};

const parseTs = s => {
  try {
    const p = s.split(':').map(Number);
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    else if (p.length === 2) return p[0] * 60 + p[1];
    return 0;
  } catch (err) {
    e('Err:parseTs', err);
    return 0;
  }
};

const wait = ms => {
  try {
    return new Promise(r => to(r, ms));
  } catch (err) {
    e('Err:wait', err);
    return Promise.resolve();
  }
};
