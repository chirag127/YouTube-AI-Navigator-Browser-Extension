export const rx = (p, f) => new RegExp(p, f);
export const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const ma = (s, r) => [...s.matchAll(r)];
export const tst = (r, s) => r.test(s);
export const ex = (r, s) => r.exec(s);
export const spl = (s, r) => s.split(r);
export const rep = (s, r, n) => s.replace(r, n);
export const repa = (s, r, n) => s.replaceAll(r, n);
export const sch = (s, r) => s.search(r);
