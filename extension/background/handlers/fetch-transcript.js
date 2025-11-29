import { rp as rep, trm } from '../../utils/shortcuts/string.js';
import { l } from '../../utils/shortcuts/log.js';
import { pf as pF } from '../../utils/shortcuts/global.js';
import { jp } from '../../utils/shortcuts/core.js';
import { afl, am, ajn } from '../../utils/shortcuts/array.js';
import { ft as tf } from '../../utils/shortcuts/network.js';
function dec(t) {
  const e = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return rep(t, /&[^;]+;/g, m => e[m] || m);
}
function pXML(x) {
  const s = [],
    r = /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g;
  let m;
  while ((m = r.exec(x)) !== null) {
    const t = dec(m[3]);
    if (trm(t)) s.push({ start: pF(m[1]), duration: m[2] ? pF(m[2]) : 0, text: t });
  }
  return s;
}
async function fYT(vid, lNg = 'en') {
  const fs = ['json3', 'srv3'];
  for (const f of fs) {
    try {
      const u = `https://www.youtube.com/api/timedtext?v=${vid}&lang=${lNg}&fmt=${f}`;
      if (f === 'json3') {
        const t = await tf(u);
        if (!t) continue;
        const d = jp(t);
        if (d.events) {
          const s = am(
            afl(d.events, e => e.segs),
            e => ({
              start: e.tStartMs / 1000,
              duration: (e.dDurationMs || 0) / 1000,
              text: ajn(
                am(e.segs, s => s.utf8),
                ''
              ),
            })
          );
          if (s.length) return { success: true, data: s };
        }
      } else {
        const x = await tf(u);
        const s = pXML(x);
        if (s.length) return { success: true, data: s };
      }
    } catch (e) {
      l(`[FetchTranscript] Error with format ${f}:`, e);
    }
  }
  return { success: false, error: 'YouTube Direct API failed' };
}
export async function handleFetchTranscript(req, rsp) {
  const { videoId, lang = 'en' } = req;
  const ms = [{ name: 'YouTube Direct API', fn: () => fYT(videoId, lang) }];
  for (const m of ms) {
    try {
      const r = await m.fn();
      if (r.success && r.data) {
        rsp(r);
        return;
      }
    } catch (e) {
      l(`[FetchTranscript] Method ${m.name} failed:`, e);
    }
  }
  rsp({ success: false, error: 'All transcript fetch methods failed' });
}
