import { ft, ftx, fj, mp, fl, jn, tr, rp, mfl } from '../../utils/shortcuts-sw.js';

async function getInvidiousInstances() {
  return [
    'https://inv.tux.pizza',
    'https://invidious.flokinet.to',
    'https://invidious.privacydev.net',
    'https://vid.puffyan.us',
    'https://invidious.kavin.rocks',
    'https://yt.artemislena.eu',
  ];
}

function parseVTT(t) {
  const s = [];
  const l = t.split('\n');
  let cs = null,
    ce = null,
    ct = [];
  const rx = /(\d{2}:)?(\d{2}:\d{2}\.\d{3}) --> (\d{2}:)?(\d{2}:\d{2}\.\d{3})/;
  const pt = ts => {
    const p = ts.split(':');
    let h = 0,
      m = 0,
      s = 0;
    if (p.length === 3) {
      h = parseFloat(p[0]);
      m = parseFloat(p[1]);
      s = parseFloat(p[2]);
    } else {
      m = parseFloat(p[0]);
      s = parseFloat(p[1]);
    }
    return h * 3600 + m * 60 + s;
  };
  for (let ln of l) {
    ln = tr(ln);
    if (!ln || ln.startsWith('WEBVTT') || ln.match(/^\d+$/)) continue;
    const m = ln.match(rx);
    if (m) {
      if (cs !== null && ct.length > 0)
        s.push({ start: cs, duration: ce - cs, text: tr(jn(ct, ' ')) });
      cs = pt(m[1] ? m[1] + m[2] : m[2]);
      ce = pt(m[3] ? m[3] + m[4] : m[4]);
      ct = [];
    } else ct.push(ln);
  }
  if (cs !== null && ct.length > 0) s.push({ start: cs, duration: ce - cs, text: tr(jn(ct, ' ')) });
  return s;
}

export async function handleFetchInvidiousTranscript(req) {
  const { videoId, lang = 'en' } = req;
  const insts = await getInvidiousInstances();
  let le = null;
  for (const i of insts) {
    try {
      const u = `${i}/api/v1/videos/${videoId}`;
      const r = await ft(u, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) continue;
      const d = await r.json();
      if (!d.captions?.length) continue;
      let ct = d.captions.find(c => c.language_code === lang) || d.captions[0];
      const cu = ct.url.startsWith('http') ? ct.url : `${i}${ct.url}`;
      const cr = await ft(cu, { headers: { Accept: 'text/vtt' } });
      if (!cr.ok) continue;
      const txt = await cr.text();
      return { success: true, data: parseVTT(txt) };
    } catch (e) {
      le = e;
    }
  }
  return { success: false, error: le?.message || 'All Invidious instances failed' };
}

export async function handleFetchInvidiousMetadata(req) {
  const { videoId } = req;
  const insts = await getInvidiousInstances();
  for (const i of insts) {
    try {
      const r = await ft(`${i}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        const d = await r.json();
        return {
          success: true,
          data: {
            title: d.title,
            author: d.author,
            description: d.description,
            viewCount: d.viewCount,
            lengthSeconds: d.lengthSeconds,
            category: d.genre,
            publishDate: d.publishedText,
          },
        };
      }
    } catch (e) { }
  }
  return { success: false, error: 'Failed to fetch metadata from Invidious' };
}
