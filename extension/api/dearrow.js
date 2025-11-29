import { l, e, w } from '../utils/shortcuts/log.js';
import { to as st, co as cst } from '../utils/shortcuts/global.js';
import { am, ajn, af } from '../utils/shortcuts/array.js';
import { trm, rp, sb as sbs } from '../utils/shortcuts/string.js';

const DAB = 'https://sponsor.ajay.app';
const DTB = 'https://dearrow-thumb.ajay.app';

export async function fetchBranding(vid, opt = {}) {
  l('ENTRY:fetchBranding');
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
        l('EXIT:fetchBranding');
        return null;
      }
      throw new Error(`DA err: ${r.status}`);
    }
    const d = await r.json();
    l('EXIT:fetchBranding');
    return pbr(d);
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchBranding timeout');
    else e('error:fetchBranding fail:', x.message);
    l('EXIT:fetchBranding');
    return null;
  }
}

export async function fetchBrandingPrivate(vid, opt = {}) {
  l('ENTRY:fetchBrandingPrivate');
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
        l('EXIT:fetchBrandingPrivate');
        return null;
      }
      throw new Error(`DA err: ${r.status}`);
    }
    const d = await r.json();
    if (d[vid]) {
      l('EXIT:fetchBrandingPrivate');
      return pbr(d[vid]);
    }
    l('EXIT:fetchBrandingPrivate');
    return null;
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchBrandingPrivate timeout');
    else e('error:fetchBrandingPrivate fail:', x.message);
    l('EXIT:fetchBrandingPrivate');
    return null;
  }
}

export function getBestTitle(bd) {
  l('ENTRY:getBestTitle');
  if (!bd?.titles?.length) {
    l('EXIT:getBestTitle');
    return null;
  }
  const tt = bd.titles.find(t => t.locked || t.votes >= 0);
  if (tt) {
    l('EXIT:getBestTitle');
    return ct(tt.title);
  }
  if (bd.titles[0]) {
    l('EXIT:getBestTitle');
    return ct(bd.titles[0].title);
  }
  l('EXIT:getBestTitle');
  return null;
}

export function getBestThumbnail(bd) {
  l('ENTRY:getBestThumbnail');
  if (!bd?.thumbnails?.length) {
    l('EXIT:getBestThumbnail');
    return null;
  }
  const tt = bd.thumbnails.find(t => t.locked || t.votes >= 0);
  if (tt && !tt.original) {
    l('EXIT:getBestThumbnail');
    return tt.timestamp;
  }
  const fc = bd.thumbnails.find(t => !t.original);
  if (fc) {
    l('EXIT:getBestThumbnail');
    return fc.timestamp;
  }
  l('EXIT:getBestThumbnail');
  return null;
}

export function getThumbnailUrl(vid, ts) {
  l('ENTRY:getThumbnailUrl');
  const p = new URLSearchParams({ videoID: vid, time: ts });
  l('EXIT:getThumbnailUrl');
  return `${DTB}/api/v1/getThumbnail?${p.toString()}`;
}

export async function fetchThumbnail(vid, ts, timeout = 5000) {
  l('ENTRY:fetchThumbnail');
  const u = getThumbnailUrl(vid, ts);
  try {
    const c = new AbortController();
    const id = st(() => c.abort(), timeout);
    const r = await fetch(u, { signal: c.signal });
    cst(id);
    if (r.status === 204) {
      e('error:fetchThumbnail fail:', r.headers.get('X-Failure-Reason'));
      l('EXIT:fetchThumbnail');
      return null;
    }
    if (!r.ok) throw new Error(`Thumb err: ${r.status}`);
    l('EXIT:fetchThumbnail');
    return await r.blob();
  } catch (x) {
    if (x.name === 'AbortError') e('error:fetchThumbnail timeout');
    else e('error:fetchThumbnail fail:', x.message);
    l('EXIT:fetchThumbnail');
    return null;
  }
}

function pbr(d) {
  l('ENTRY:pbr');
  l('EXIT:pbr');
  return {
    titles: d.titles || [],
    thumbnails: d.thumbnails || [],
    randomTime: d.randomTime || null,
    videoDuration: d.videoDuration || null,
  };
}
function ct(t) {
  l('ENTRY:ct');
  if (!t) {
    l('EXIT:ct');
    return '';
  }
  l('EXIT:ct');
  return trm(rp(t, />\s*/g, ''));
}
async function gsp(vid) {
  l('ENTRY:gsp');
  const e = new TextEncoder();
  const d = e.encode(vid);
  const hb = await crypto.subtle.digest('SHA-256', d);
  const ha = af(new Uint8Array(hb));
  const hh = ajn(
    am(ha, b => b.toString(16).padStart(2, '0')),
    ''
  );
  l('EXIT:gsp');
  return sbs(hh, 0, 4);
}

export async function getVideoMetadata(vid, opt = {}) {
  l('ENTRY:getVideoMetadata');
  const { usePrivateAPI = true } = opt;
  const bd = usePrivateAPI ? await fetchBrandingPrivate(vid, opt) : await fetchBranding(vid, opt);
  if (!bd) {
    l('EXIT:getVideoMetadata');
    return {
      videoId: vid,
      hasDeArrowData: false,
      title: null,
      thumbnail: null,
    };
  }
  const t = getBestTitle(bd);
  const ts = getBestThumbnail(bd);
  l('EXIT:getVideoMetadata');
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
