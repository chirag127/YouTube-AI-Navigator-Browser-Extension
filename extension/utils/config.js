import { sg, ss } from './shortcuts/storage.js';
import { nw, jp, js } from './shortcuts/core.js';
import { isa } from './shortcuts/array.js';
export const DC = {
  ca: { en: 1, ttl: 864e5, tr: 1, co: 1, md: 1 },
  sc: { as: 0, sb: 1, sn: 1, sm: 1 },
  tr: {
    ac: 1,
    ad: 1e3,
    ao: 0,
    lg: 'en',
    mt: 'auto',
    ts: 1,
    so: ['dom-automation', 'genius', 'speech-to-text'],
  },
  co: { en: 1, lm: 20, ir: 0, sb: 'top', as: 1 },
  md: { ti: 1, au: 1, vw: 1, du: 1, ds: 1, tg: 1, ud: 1 },
  ui: { th: 'dark', wp: 'secondary', ae: 0, st: 1, cm: 0 },
  ai: { k: '', m: 'gemini-2.5-flash-lite-preview-09-2025', cp: '', ol: 'en', t: 0.7, mt: 8192 },
  au: { aa: 0, al: 0, at: 50, ln: 0, ll: 0 },
  sg: {
    en: 0,
    ct: {
      sp: { a: 'skip', s: 2 },
      sf: { a: 'skip', s: 2 },
      in: { a: 'ignore', s: 2 },
      ou: { a: 'ignore', s: 2 },
      it: { a: 'ignore', s: 2 },
      mo: { a: 'ignore', s: 2 },
      pv: { a: 'ignore', s: 2 },
      fl: { a: 'ignore', s: 2 },
      ph: { a: 'ignore', s: 2 },
      ea: { a: 'ignore', s: 2 },
    },
    as: 0,
    sn: 1,
    st: 0.5,
    md: 1,
  },
  ex: { tm: '', nd: '', gf: '', tc: '', ta: '' },
  ad: { db: 0, sh: 1, mh: 100, et: 0 },
  _m: { v: '1.0.0', lu: Date.now(), ob: 0 },
};
export class ConfigManager {
  constructor() {
    this.c = { ...DC };
    this.l = [];
  }
  async load() {
    const s = await sg('cfg');
    if (s.cfg) this.c = this.mg(DC, s.cfg);
    return this.c;
  }
  async save() {
    this.c._m.lu = nw();
    await ss('cfg', this.c);
    this.nt();
  }
  get(p) {
    if (!p) return this.c;
    return p.split('.').reduce((o, k) => o?.[k], this.c);
  }
  set(p, v) {
    const k = p.split('.'),
      l = k.pop(),
      t = k.reduce((o, x) => {
        if (!o[x]) o[x] = {};
        return o[x];
      }, this.c);
    t[l] = v;
  }
  async update(p, v) {
    this.set(p, v);
    await this.save();
  }
  async reset() {
    this.c = { ...DC };
    await this.save();
  }
  sub(cb) {
    this.l.push(cb);
  }
  nt() {
    this.l.forEach(cb => cb(this.c));
  }
  mg(d, s) {
    const r = { ...d };
    for (const k in s) {
      if (typeof s[k] === 'object' && !isa(s[k])) r[k] = this.mg(d[k] || {}, s[k]);
      else r[k] = s[k];
    }
    return r;
  }
  exp() {
    return js(this.c);
  }
  async imp(j) {
    try {
      const i = jp(j);
      this.c = this.mg(DC, i);
      await this.save();
      return 1;
    } catch (e) {
      return 0;
    }
  }
}
let inst = null;
export const getCfg = () => {
  if (!inst) inst = new ConfigManager();
  return inst;
};
