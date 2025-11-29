import { l } from '../utils/shortcuts/log.js';
import { cw } from '../utils/shortcuts/chrome.js';
import { js, ok as ks } from '../utils/shortcuts/core.js';
import { mp, jn } from '../utils/shortcuts/array.js';
import { ce } from '../utils/shortcuts/dom.js';

const API_BASE = 'https://sponsor.ajay.app/api';
const CM = {
  sponsor: 'Sponsor',
  selfpromo: 'Self Promotion',
  interaction: 'Interaction Reminder',
  intro: 'Intermission/Intro',
  outro: 'Endcards/Credits',
  preview: 'Preview/Recap',
  music_offtopic: 'Off-Topic',
  poi_highlight: 'Highlight',
  filler: 'Filler/Tangent',
  exclusive_access: 'Exclusive Access',
  chapter: 'Chapter',
};

async function _gh(vid) {
  const e = new TextEncoder();
  const d = e.encode(vid);
  const hb = await crypto.subtle.digest('SHA-256', d);
  const ha = Array.from(new Uint8Array(hb));
  const hh = mp(ha, b => b.toString(16).padStart(2, '0')).join('');
  return hh.substring(0, 4);
}

function _mc(c) {
  return CM[c] || c;
}

export async function fetchSegments(vid) {
  if (!vid) {
    cw('[SB] No vid');
    return [];
  }
  try {
    l(`[SB] Fetch: ${vid}`);
    const hp = await _gh(vid);
    const c = ks(CM);
    const cp = jn(
      mp(c, x => `category=${x}`),
      '&'
    );
    const u = `${API_BASE}/skipSegments/${hp}?service=YouTube&${cp}`;
    l(`[SB] URL: ${u}`);
    const r = await fetch(u);
    if (r.status === 404) {
      l('[SB] 404');
      return [];
    }
    if (r.status === 429) {
      cw('[SB] 429');
      return [];
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    l(`[SB] Resp:`, js(d));
    const vd = d.find(v => v.videoID === vid);
    if (!vd || !vd.segments) {
      l('[SB] No segs');
      return [];
    }
    const s = mp(vd.segments, sg => ({
      start: sg.segment[0],
      end: sg.segment[1],
      category: _mc(sg.category),
      categoryCode: sg.category,
      UUID: sg.UUID,
      votes: sg.votes,
      locked: sg.locked,
      actionType: sg.actionType || 'skip',
      description: sg.description || '',
    }));
    l(`[SB] Mapped ${s.length}`);
    return s;
  } catch (x) {
    ce('[SB] Fail:', x.message);
    return [];
  }
}
export const sponsorBlockAPI = { fetchSegments };
