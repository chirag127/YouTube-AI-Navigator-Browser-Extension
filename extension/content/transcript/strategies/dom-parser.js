import { ft } from '../../../utils/shortcuts/network.js';
import { qs as $, qsa as $$ } from '../../../utils/shortcuts/dom.js';

export const name = 'DOM Parser';
export const priority = 50;

export const extract = async (vid, lang = 'en') => {
  if (window.ytInitialPlayerResponse?.captions) {
    const c = window.ytInitialPlayerResponse.captions;
    const ts = c.playerCaptionsTracklistRenderer?.captionTracks;
    if (ts) {
      const t = ts.find(x => x.languageCode === lang) || ts[0];
      if (t?.baseUrl) {
        const s = await fetchAndParse(t.baseUrl);
        if (s.length > 0) return s;
      }
    }
  }
  const p = $('#segments-container');
  if (p) {
    const s = parseTranscriptPanel(p);
    if (s.length > 0) return s;
  }
  throw new Error('DOM parsing failed');
};

const fetchAndParse = async u => {
  try {
    const r = await ft(u);
    const t = await r.text();
    return parseVTT(t);
  } catch (e) {
    return [];
  }
};

const parseVTT = v => {
  const s = [],
    l = v.split('\n');
  let i = 0;
  while (i < l.length) {
    const ln = l[i].trim();
    if (ln.includes('-->')) {
      const [st, en] = ln.split('-->').map(t => parseTime(t.trim()));
      i++;
      let t = '';
      while (i < l.length && l[i].trim() && !l[i].includes('-->')) {
        t += l[i].trim() + ' ';
        i++;
      }
      t = t.trim().replace(/<[^>]+>/g, '');
      if (t) s.push({ start: st, duration: en - st, text: t });
    }
    i++;
  }
  return s;
};

const parseTime = t => {
  const p = t.split(':');
  if (p.length === 3) return parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2]);
  if (p.length === 2) return parseFloat(p[0]) * 60 + parseFloat(p[1]);
  return parseFloat(p[0]);
};

const parseTranscriptPanel = p => {
  const s = [];
  $$('ytd-transcript-segment-renderer', p).forEach(i => {
    const te = $('[class*="time"]', i),
      xe = $('[class*="segment-text"]', i);
    if (te && xe)
      s.push({ start: parseTimeString(te.textContent), duration: 0, text: xe.textContent.trim() });
  });
  return s;
};

const parseTimeString = s => {
  const p = s.split(':').map(x => parseInt(x, 10));
  if (p.length === 2) return p[0] * 60 + p[1];
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  return 0;
};
