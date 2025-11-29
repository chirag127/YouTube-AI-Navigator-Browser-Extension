import { l, e } from './shortcuts/log.js';
import { nw } from './shortcuts/core.js';
export const log = (m, ...a) => l(`[YT]${m}`, ...a);
export const err = (m, x) => e(`[YT]${m}`, x?.message || x);
export const ok = (m, ...a) => l(`[YT]✅${m}`, ...a);
const c = new Map();
export const cached = (k, ttl = 3e5) => ({
  get: () => {
    const i = c.get(k);
    return i && nw() - i.t < ttl ? i.v : null;
  },
  set: v => c.set(k, { v, t: nw() }),
});
