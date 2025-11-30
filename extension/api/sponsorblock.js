import { cwr as cw } from '../utils/shortcuts/chrome.js';
import { am, ajn, af } from '../utils/shortcuts/array.js';
import { ce } from '../utils/shortcuts/dom.js';
import { LM } from '../utils/shortcuts/segments.js';

const API_BASE = 'https://sponsor.ajay.app/api';

async function _gh(vid) {
  const e = new TextEncoder();
  const d = e.encode(vid);
  const hb = await crypto.subtle.digest('SHA-256', d);
  const ha = af(new Uint8Array(hb));
  const hh = am(ha, b => b.toString(16).padStart(2, '0')).join('');
  return hh.substring(0, 4);
}

const CATEGORIES = [
  'sponsor',
  'selfpromo',
  'interaction',
  'intro',
  'outro',
  'preview',
  'hook',
  'music_offtopic',
  'poi_highlight',
  'filler',
  'exclusive_access',
  'chapter',
  'content',
];

export async function fetchSegments(vid) {
  if (!vid) {
    cw('[SB] No vid');
    return [];
  }
  try {
    const hp = await _gh(vid);
    const cp = ajn(
      am(CATEGORIES, x => `category=${x}`),
      '&'
    );
    const u = `${API_BASE}/skipSegments/${hp}?service=YouTube&${cp}`;

    const r = await fetch(u);
    if (r.status === 404) {
      return [];
    }
    if (r.status === 429) {
      cw('[SB] 429');
      return [];
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();

    const vd = d.find(v => v.videoID === vid);
    if (!vd || !vd.segments) {
      return [];
    }
    const s = am(vd.segments, sg => {
      return {
        start: sg.segment[0],
        end: sg.segment[1],
        label: sg.category,
        labelFull: LM[sg.category] || sg.category,
        category: sg.category,
        UUID: sg.UUID,
        votes: sg.votes,
        locked: sg.locked,
        actionType: sg.actionType || 'skip',
        description: sg.description || '',
      };
    });

    return s;
  } catch (x) {
    ce('[SB] Fail:', x.message);
    return [];
  }
}
export const sponsorBlockAPI = { fetchSegments };
