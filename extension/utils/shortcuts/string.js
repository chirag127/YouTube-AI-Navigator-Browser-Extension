export const trm = s => s?.trim();
export const lwc = s => s?.toLowerCase();
export const uc = s => s?.toUpperCase();
export const sws = (s, n) => s?.startsWith(n);
export const ews = (s, n) => s?.endsWith(n);
export const inc = (s, n) => s?.includes(n);
export const sb = (s, a, b) => s?.substring(a, b);
export const rp = (s, a, b, f) => s?.replace(a, b, f);

export const mt = (s, r) => s?.match(r);
export const spt = (s, d) => s?.split(d);
export const pd = (s, l, c) => s?.padStart(l, c);
export const jn = (a, s) => a?.join(s);
export const slc = (s, a, b) => s?.slice(a, b);

export const ic = inc;
export const us = uc;
export const li = (s, v, i) => s?.lastIndexOf(v, i);
export const ia = (a, v) => a?.indexOf(v);
