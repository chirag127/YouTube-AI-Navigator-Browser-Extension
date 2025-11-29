import { handleFetchInvidiousTranscript } from './invidious.js';
import { rp, tr, pF, jp, fl, mp, jn, ft, ftx } from '../../utils/shortcuts-sw.js';

function dec(t) {
  const e = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return rp(t, /&[^;]+;/g, m => e[m] || m);
}

function pXML(x) {
  const s = [],
    r = /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g;
  let m;
  while ((m = r.exec(x)) !== null) {
    const t = dec(m[3]);
    if (tr(t)) s.push({ start: pF(m[1]), duration: m[2] ? pF(m[2]) : 0, text: t });
  }
  return s;
}

async function fYT(vid, l = 'en') {
  const fs = ['json3', 'srv3'];
  for (const f of fs) {
    try {
      const u = `https://www.youtube.com/api/timedtext?v=${vid}&lang=${l}&fmt=${f}`;
      if (f === 'json3') {
        const t = await ftx(u);
        if (!t) continue;
        const d = jp(t);
        if (d.events) {
          const s = mp(
            fl(d.events, e => e.segs),
            e => ({
              start: e.tStartMs / 1000,
              duration: (e.dDurationMs || 0) / 1000,
              text: jn(
                mp(e.segs, s => s.utf8),
                ''
              ),
            })
          );
          if (s.length) return { success: true, data: s };
        }
      } else {
        const x = await ftx(u);
        const s = pXML(x);
        if (s.length) return { success: true, data: s };
      }
    } catch (e) { }
  }
  return { success: false, error: 'YouTube Direct API failed' };
}

export async function handleFetchTranscript(req, rsp) {
  const { videoId, lang = 'en' } = req;
  const ms = [
    {
      name: 'Invidious API',
      fn: () => handleFetchInvidiousTranscript(req),
    },
    { name: 'YouTube Direct API', fn: () => fYT(videoId, lang) },
  ];
  for (const m of ms) {
    try {
      const r = await m.fn();
      if (r.success && r.data) {
        rsp(r);
        return;
      }
    } catch (e) { }
  }
  rsp({ success: false, error: 'All transcript fetch methods failed' });
}
