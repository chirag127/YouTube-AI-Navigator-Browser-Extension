export const wn = chrome?.windows;
export const loc = typeof location !== 'undefined' ? location : null;
export const to = setTimeout;
export const co = clearTimeout;
export const rAF =
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame : cb => setTimeout(cb, 16);
export const pi = parseInt;
export const pf = parseFloat;
export const cf = typeof confirm === 'function' ? confirm : () => false;
export const al = typeof alert === 'function' ? alert : () => {};
export const pm = typeof prompt === 'function' ? prompt : () => null;
export const en = encodeURIComponent;
export const de = decodeURIComponent;
export const si = setInterval;
export const ci = clearInterval;
export const clt = clearTimeout;
export const pI = parseInt;
