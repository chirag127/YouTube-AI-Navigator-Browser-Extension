export const d = document;
export const qs = (s, p = d) => p.querySelector(s);
export const qsa = (s, p = d) => p.querySelectorAll(s);
export const qa = (s, p = d) => [...p.querySelectorAll(s)];
export const el = (t, c = '', a = {}) => {
  const e = d.createElement(t);
  if (c) e.className = c;
  Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
};
export const ce = el;
export const on = (e, t, h, o) => e?.addEventListener(t, h, o);
export const off = (e, t, h) => e?.removeEventListener(t, h);
export const txt = (e, t) => (e.textContent = t);
export const html = (e, h) => (e.innerHTML = h);
export const mo = c => new MutationObserver(c);
export const id = i => d.getElementById(i);
export const wfe = (s, t = 500) =>
  new Promise(r => {
    if (qs(s)) return r(qs(s));
    const i = setInterval(() => {
      const e = qs(s);
      if (e) {
        clearInterval(i);
        r(e);
      }
    }, t);
  });
export const gebi = id;
export const ap = (p, c) => p?.appendChild(c);
export const tc = txt;
export const ih = html;
export const vl = e => e.value;
export const rc = (e, c) => e.classList.remove(c);
export const ac = (e, c) => e.classList.add(c);
export const dc = document;
export const tx = t => document.createTextNode(t);
export const fc = (n, f) => n.forEach(f);

export const sb = (s, a, b) => s?.substring(a, b);
export const ge = id;
export const $ = qs;
export const $$ = qsa;
export const ae = on;
export const re = off;

export const ael = on;
export const rel = off;
export const rm = (e) => e?.remove();
