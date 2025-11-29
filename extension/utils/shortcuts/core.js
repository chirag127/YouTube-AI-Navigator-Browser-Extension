export const keys = Object.keys;
export const vl = Object.values;
export const ents = Object.entries;
export const assign = Object.assign;
export const json = JSON.stringify;
export const parse = JSON.parse;
export const now = Date.now;
export const log = console.log;
export const err = console.error;
export const warn = console.warn;
export const dbg = console.debug;
export const to = setTimeout;
export const ti = setInterval;
export const ct = clearTimeout;
export const ci = clearInterval;

// Array
export const isA = Array.isArray;
export const fr = Array.from;
export const of = Array.of;
export const mp = (a, f) => a?.map(f);
export const fl = (a, f) => a?.filter(f);
export const rd = (a, f, i) => a?.reduce(f, i);
export const fe = (a, f) => a?.forEach(f);
export const fn = (a, f) => a?.find(f);
export const fi = (a, f) => a?.findIndex(f);
export const sm = (a, f) => a?.some(f);
export const ev = (a, f) => a?.every(f);
export const inc = (a, v) => a?.includes(v);
export const sl = (a, b, e) => a?.slice(b, e);
export const sp = (a, b, e) => a?.splice(b, e);
export const jn = (a, s) => a?.join(s);
export const cn = (a, ...v) => a?.concat(...v);
export const rv = a => a?.reverse();
export const st = (a, f) => a?.sort(f);
export const flt = (a, d) => a?.flat(d);
export const fm = (a, f) => a?.flatMap(f);

// String
export const tr = s => s?.trim();
export const lc = s => s?.toLowerCase();
export const uc = s => s?.toUpperCase();
export const sw = (s, n) => s?.startsWith(n);
export const ew = (s, n) => s?.endsWith(n);
export const sb = (s, a, b) => s?.substring(a, b);
export const rp = (s, a, b, f) => s?.replace(a, b, f);
export const mt = (s, r) => s?.match(r);

// Network
export const ft = fetch;
export const Rq = Request;
export const Rs = Response;
export const Hd = Headers;
export const fd = FormData;
export const usp = URLSearchParams;

// JSON aliases
export const js = JSON.stringify;
export const jp = JSON.parse;
export const isS = s => typeof s === 'string';

// Additional exports
export const nw = Date.now;
export const np = Promise;
export const ok = Object.keys;
export const oe = Object.entries;

export const E = Error;
export const vals = vl;

export const pI = parseInt;
