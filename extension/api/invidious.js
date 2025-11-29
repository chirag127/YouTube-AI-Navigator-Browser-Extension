import { l, w, e, d, i, fj, ftx, jp, pI, pF, cr, mp, fl, jn, tr, rp } from '../utils/shortcuts.js';

const FALLBACK_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.f5.si',
  'https://inv.perditum.com',
  'https://yewtu.be',
];
let cil = null,
  ilct = 0;
const ILCD = 5 * 60 * 1000;
let wi = null,
  lic = 0;
const ICI = 5 * 60 * 1000;

class Logger {
  constructor(p) {
    this.p = p;
  }
  info(m, ...a) {
    i(`[${this.p}] ℹ️ ${m}`, ...a);
  }
  success(m, ...a) {
    l(`[${this.p}] ✅ ${m}`, ...a);
  }
  warn(m, ...a) {
    w(`[${this.p}] ⚠️ ${m}`, ...a);
  }
  error(m, ...a) {
    e(`[${this.p}] ❌ ${m}`, ...a);
  }
  debug(m, ...a) {
    d(`[${this.p}] 🔍 ${m}`, ...a);
  }
}
const log = new Logger('Invidious');

async function fwi() {
  const n = Date.now();
  if (wi && n - lic < ICI) {
    log.debug(`Cached inst: ${wi}`);
    return wi;
  }
  log.info('Finding inst...');
  const ins = await gil();
  for (const inst of ins) {
    try {
      log.debug(`Testing: ${inst}`);
      const r = await fetch(`${inst}/api/v1/stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(5e3),
      });
      if (r.ok) {
        const d = await r.json();
        log.success(`Found: ${inst}`, {
          v: d.software?.version,
          or: d.openRegistrations,
        });
        wi = inst;
        lic = n;
        return inst;
      }
    } catch (x) {
      log.warn(`${inst} fail:`, x.message);
    }
  }
  throw new Error('No working inst');
}

async function gil() {
  if (cil && Date.now() - ilct < ILCD) return cil;
  cil = FALLBACK_INSTANCES;
  ilct = Date.now();
  return cil;
}

export async function fetchVideoData(vid, reg = 'US') {
  log.info(`Fetch vid: ${vid}`);
  const inst = await fwi();
  const u = `${inst}/api/v1/videos/${vid}?region=${reg}`;
  log.debug(`URL: ${u}`);
  try {
    const d = await fj(u, { signal: AbortSignal.timeout(1e4) });
    log.success(`Vid data ok`, {
      t: d.title,
      a: d.author,
      l: d.lengthSeconds,
      v: d.viewCount,
      c: d.captions?.length || 0,
    });
    return d;
  } catch (x) {
    log.error(`Vid fetch fail:`, x.message);
    throw x;
  }
}

export async function fetchTranscript(vid, lang = 'en') {
  log.info(`Fetch tr: ${vid} (${lang})`);
  try {
    const vd = await fetchVideoData(vid);
    if (!vd.captions || vd.captions.length === 0) throw new Error('No caps');
    log.debug(
      `Avail caps:`,
      mp(vd.captions, c => ({ l: c.label, lc: c.language_code }))
    );
    let ct = vd.captions.find(c => c.language_code === lang);
    if (!ct) {
      log.warn(`Lang '${lang}' not found, using: ${vd.captions[0].language_code}`);
      ct = vd.captions[0];
    }
    log.debug(`Sel cap:`, { l: ct.label, lc: ct.language_code, u: ct.url });
    const cu = ct.url;
    const ctTxt = await ftx(cu, { signal: AbortSignal.timeout(1e4) });
    log.debug(`Cap data len: ${ctTxt.length}`);
    const segs = pcd(ctTxt);
    log.success(`Tr parsed: ${segs.length} segs`);
    return segs;
  } catch (x) {
    log.error(`Tr fail:`, x.message);
    throw x;
  }
}

function pcd(d) {
  log.debug('Parsing cap data...');
  if (d.includes('WEBVTT')) return pwv(d);
  if (tr(d).startsWith('<?xml') || d.includes('<transcript>')) return px(d);
  try {
    const j = jp(d);
    if (j.events) return pj3(j);
  } catch (e) { }
  log.warn('Unknown fmt, generic parse');
  return pg(d);
}

function pwv(d) {
  log.debug('Parsing WebVTT');
  const s = [],
    l = d.split('\n');
  let cs = null;
  for (let i = 0; i < l.length; i++) {
    const ln = tr(l[i]);
    if (!ln || ln.startsWith('WEBVTT') || ln.startsWith('NOTE')) continue;
    if (ln.includes('-->')) {
      const [ss, es] = mp(ln.split('-->'), x => tr(x));
      const st = pts(ss),
        en = pts(es);
      cs = { start: st, duration: en - st, text: '' };
    } else if (cs) {
      cs.text += (cs.text ? ' ' : '') + ln;
      if (i + 1 >= l.length || !tr(l[i + 1]) || l[i + 1].includes('-->')) {
        s.push(cs);
        cs = null;
      }
    }
  }
  log.debug(`Parsed ${s.length} VTT segs`);
  return s;
}

function px(d) {
  log.debug('Parsing XML');
  const s = [],
    r = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
  let m;
  while ((m = r.exec(d)) !== null) s.push({ start: pF(m[1]), duration: pF(m[2]), text: dh(m[3]) });
  log.debug(`Parsed ${s.length} XML segs`);
  return s;
}

function pj3(d) {
  log.debug('Parsing JSON3');
  const s = mp(
    fl(d.events, e => e.segs),
    e => ({
      start: e.tStartMs / 1e3,
      duration: (e.dDurationMs || 0) / 1e3,
      text: jn(
        mp(e.segs, sg => sg.utf8),
        ''
      ),
    })
  );
  log.debug(`Parsed ${s.length} JSON3 segs`);
  return s;
}

function pg(d) {
  log.debug('Generic parse');
  const l = fl(d.split('\n'), x => tr(x));
  return mp(l, (ln, i) => ({ start: i * 2, duration: 2, text: tr(ln) }));
}

function pts(ts) {
  const p = ts.split(':');
  let s = 0;
  if (p.length === 3) s = pI(p[0]) * 3600 + pI(p[1]) * 60 + pF(p[2]);
  else if (p.length === 2) s = pI(p[0]) * 60 + pF(p[1]);
  else s = pF(p[0]);
  return s;
}

function dh(t) {
  const ta = _cr('textarea');
  ta.innerHTML = t;
  return ta.value;
}

export async function fetchMetadata(vid) {
  log.info(`Fetch meta: ${vid}`);
  try {
    const d = await fetchVideoData(vid);
    const m = {
      videoId: d.videoId,
      title: d.title,
      author: d.author,
      authorId: d.authorId,
      lengthSeconds: d.lengthSeconds,
      viewCount: d.viewCount,
      likeCount: d.likeCount,
      published: d.published,
      description: d.description,
      keywords: d.keywords || [],
      genre: d.genre,
      isFamilyFriendly: d.isFamilyFriendly,
      captionsAvailable: (d.captions?.length || 0) > 0,
      availableLanguages: mp(d.captions || [], c => c.language_code),
    };
    log.success('Meta extracted');
    return m;
  } catch (x) {
    log.error('Meta fail:', x.message);
    throw x;
  }
}

export async function searchVideos(q, o = {}) {
  log.info(`Search: ${q}`);
  const inst = await fwi();
  const p = new URLSearchParams({
    q,
    page: o.page || 1,
    sort: o.sort || 'relevance',
    type: o.type || 'video',
    ...o,
  });
  const u = `${inst}/api/v1/search?${p}`;
  log.debug(`Search URL: ${u}`);
  try {
    const r = await fj(u, { signal: AbortSignal.timeout(1e4) });
    log.success(`Found ${r.length}`);
    return r;
  } catch (x) {
    log.error('Search fail:', x.message);
    throw x;
  }
}
