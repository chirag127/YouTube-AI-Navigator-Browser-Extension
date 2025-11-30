import { e } from '../utils/shortcuts/log.js';
import { to as st, co as cst } from '../utils/shortcuts/global.js';
import { am, ajn, af } from '../utils/shortcuts/array.js';
import { trm, rp, sb as sbs } from '../utils/shortcuts/string.js';

const DAB = 'https://sponsor.ajay.app';
const DTB = 'https://dearrow-thumb.ajay.app';

export async function fetchBranding(vid, opt = {}) {
  const { returnUserID = false, fetchAll = false, timeout = 5000 } = opt;
  const p = new URLSearchParams({ videoID: vid, service: 'YouTube' });
  if (returnUserID) p.append('returnUserID', 'true');
  if (fetchAll) p.append('fetchAll', 'true');
  const u = `${DAB}/api/branding?${p.toString()}`;
  try {
    const c = new AbortController();
    const id = st(() => c.abort(), timeout);
    const r = await fetch(u, {
      signal: c.signal,
      headers: { Accept: 'application/json' },
    });
    cst(id);
    if (!r.ok) {
      if (r.status === 404) {
        return null;
      }
      throw new Error(`DA err: ${r.status}`);
    }
    const d = await r.json();
    return pbr(d);
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchBranding timeout');
    else e('error:fetchBranding fail:', x.message);
    return null;
  }
}

import { sg } from '../utils/shortcuts/storage.js';

export async function getBranding(videoId) {
  const cfg = await sg('integrations');
  if (cfg.integrations?.dearrow?.enabled === false) return null;

  const url = `https://sponsor.ajay.app/api/branding?videoID=${videoId}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

export async function fetchBrandingPrivate(vid, opt = {}) {
  const hp = await gsp(vid);
  const { returnUserID = false, fetchAll = false, timeout = 5000 } = opt;
  const p = new URLSearchParams({ service: 'YouTube' });
  if (returnUserID) p.append('returnUserID', 'true');
  if (fetchAll) p.append('fetchAll', 'true');
  const u = `${DAB}/api/branding/${hp}?${p.toString()}`;
  try {
    const c = new AbortController();
    const id = st(() => c.abort(), timeout);
    const r = await fetch(u, {
      signal: c.signal,
      headers: { Accept: 'application/json' },
    });
    cst(id);
    if (!r.ok) {
      if (r.status === 404) {
        return null;
      }
      throw new Error(`DA err: ${r.status}`);
    }
    const d = await r.json();
    if (d[vid]) {
      return pbr(d[vid]);
    }
    return null;
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchBrandingPrivate timeout');
    else e('error:fetchBrandingPrivate fail:', x.message);
    return null;
  }
}

export function getBestTitle(bd) {
  if (!bd?.titles?.length) {
    return null;
  }
  const tt = bd.titles.find(t => t.locked || t.votes >= 0);
  if (tt) {
    return ct(tt.title);
  }
  if (bd.titles[0]) {
    return ct(bd.titles[0].title);
  }
  return null;
}

export function getBestThumbnail(bd) {
  if (!bd?.thumbnails?.length) {
    return null;
  }
  const tt = bd.thumbnails.find(t => t.locked || t.votes >= 0);
  if (tt && !tt.original) {
    return tt.timestamp;
  }
  const fc = bd.thumbnails.find(t => !t.original);
  if (fc) {
    return fc.timestamp;
  }
  return null;
}

export function getThumbnailUrl(vid, ts) {
  const p = new URLSearchParams({ videoID: vid, time: ts });
  return `${DTB}/api/v1/getThumbnail?${p.toString()}`;
}

export async function fetchThumbnail(vid, ts, timeout = 5000) {
  const u = getThumbnailUrl(vid, ts);
  try {
    const c = new AbortController();
    const id = st(() => c.abort(), timeout);
    const r = await fetch(u, { signal: c.signal });
    cst(id);
    if (r.status === 204) {
      e('error:fetchThumbnail fail:', r.headers.get('X-Failure-Reason'));
      return null;
    }
    if (!r.ok) throw new Error(`Thumb err: ${r.status}`);
    return await r.blob();
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchThumbnail timeout');
    else e('error:fetchThumbnail fail:', x.message);
    return null;
  }
}

function pbr(d) {
  return {
    titles: d.titles || [],
    thumbnails: d.thumbnails || [],
    randomTime: d.randomTime || null,
    videoDuration: d.videoDuration || null,
  };
}
function ct(t) {
  if (!t) {
    return '';
  }
  return trm(rp(t, />\s*/g, ''));
}
async function gsp(vid) {
  const e = new TextEncoder();
  const d = e.encode(vid);
  const hb = await crypto.subtle.digest('SHA-256', d);
  const ha = af(new Uint8Array(hb));
  const hh = ajn(
    am(ha, b => b.toString(16).padStart(2, '0')),
    ''
  );
  return sbs(hh, 0, 4);
}

export async function getVideoMetadata(vid, opt = {}) {
  const { usePrivateAPI = true } = opt;
  const bd = usePrivateAPI ? await fetchBrandingPrivate(vid, opt) : await fetchBranding(vid, opt);
  if (!bd) {
    return {
      videoId: vid,
      hasDeArrowData: false,
      title: null,
      thumbnail: null,
    };
  }
  const t = getBestTitle(bd);
  const ts = getBestThumbnail(bd);
  return {
    videoId: vid,
    hasDeArrowData: true,
    title: t,
    thumbnail: ts ? { timestamp: ts, url: getThumbnailUrl(vid, ts) } : null,
    rawData: bd,
  };
}

export const deArrowAPI = {
  fetchBranding,
  fetchBrandingPrivate,
  getBestTitle,
  getBestThumbnail,
  getThumbnailUrl,
  fetchThumbnail,
  getVideoMetadata,
};
