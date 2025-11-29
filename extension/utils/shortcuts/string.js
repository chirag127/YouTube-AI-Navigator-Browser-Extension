export const tr = s => s?.trim();
export const lc = s => s?.toLowerCase();
export const uc = s => s?.toUpperCase();
export const spt = (s, d) => s?.split(d);
export const rp = (s, f, t) => s?.replace(f, t);
export const rpa = (s, f, t) => s?.replaceAll(f, t);
export const mt = (s, r) => s?.match(r);
export const m = mt; // Alias for match
export const ma = (s, r) => s?.matchAll(r);
export const sw = (s, t) => s?.startsWith(t);
export const ew = (s, t) => s?.endsWith(t);
export const sbs = (s, i, e) => s?.substring(i, e);
export const sbr = (s, i, l) => s?.substr(i, l);
export const cc = (s, i) => s?.charCodeAt(i);
export const ca = (s, i) => s?.charAt(i);
export const pd = (s, l, c = ' ') => s?.padStart(l, c);
export const pe = (s, l, c = ' ') => s?.padEnd(l, c);
export const rpt = (s, n) => s?.repeat(n);
