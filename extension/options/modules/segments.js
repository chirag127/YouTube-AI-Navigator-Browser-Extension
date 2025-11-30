import { SEGMENT_CATEGORIES, DEFAULT_SEGMENT_CONFIG } from './settings-manager.js';
import { qs as i, on } from '../../utils/shortcuts/dom.js';
import { pf } from '../../utils/shortcuts/global.js';
export class SegmentsConfig {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const c = this.s.get(),
      en = i('#enableSegments'),
      g = i('#segmentsGrid');
    if (en) en.checked = c.segments?.enabled ?? true;
    if (g) this.render(g);
    if (en) on(en, 'change', e => this.a.save('segments.enabled', e.target.checked));
    const sb = i('#skipAllBtn'),
      sp = i('#speedAllBtn'),
      rb = i('#resetAllBtn');
    if (sb) on(sb, 'click', () => this.setAll('skip'));
    if (sp) on(sp, 'click', () => this.setAll('speed'));
    if (rb) on(rb, 'click', () => this.setAll('ignore'));
  }
  render(g) {
    const t = i('#segmentItemTemplate');
    g.innerHTML = '';
    const c = this.s.get().segments?.categories || {};
    SEGMENT_CATEGORIES.forEach(cat => {
      const cl = t.content.cloneNode(true),
        i = cl.querySelector('.segment-item'),
        co = cl.querySelector('.segment-color'),
        n = cl.querySelector('.segment-name'),
        a = cl.querySelector('.segment-action'),
        sc = cl.querySelector('.speed-control'),
        ss = cl.querySelector('.speed-slider'),
        sv = cl.querySelector('.speed-value');
      i.dataset.category = cat.id;
      co.style.backgroundColor = cat.color;
      n.textContent = cat.label;
      const cfg = c[cat.id] || { ...DEFAULT_SEGMENT_CONFIG };
      a.value = cfg.action;
      ss.value = cfg.speed;
      sv.textContent = `${cfg.speed}x`;
      if (cfg.action === 'speed') sc.classList.remove('hidden');
      on(a, 'change', () => {
        const v = a.value;
        if (v === 'speed') sc.classList.remove('hidden');
        else sc.classList.add('hidden');
        this.update(cat.id, { action: v });
      });
      on(ss, 'input', () => {
        const v = ss.value;
        sv.textContent = `${v}x`;
        this.update(cat.id, { speed: pf(v) });
      });
      g.appendChild(cl);
    });
  }
  async update(id, u) {
    const c = this.s.get(),
      cats = { ...(c.segments?.categories || {}) };
    if (!cats[id]) cats[id] = { ...DEFAULT_SEGMENT_CONFIG };
    cats[id] = { ...cats[id], ...u };
    this.s.set('segments.categories', cats);
    await this.s.save();
  }
  async setAll(a) {
    const c = this.s.get(),
      cats = { ...(c.segments?.categories || {}) };
    SEGMENT_CATEGORIES.forEach(cat => {
      if (!cats[cat.id]) cats[cat.id] = { ...DEFAULT_SEGMENT_CONFIG };
      cats[cat.id] = { ...cats[cat.id], action: a };
    });
    this.s.set('segments.categories', cats);
    await this.s.save();
    const g = i('#segmentsGrid');
    if (g) this.render(g);
  }
}
