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
      as = i('#enableAutoSkip'),
      sn = i('#showSegmentNotifications'),
      sm = i('#showSegmentMarkers'),
      st = i('#skipTolerance'),
      stv = i('#skipToleranceValue'),
      msd = i('#minSegmentDuration'),
      msdv = i('#minSegmentDurationValue'),
      g = i('#segmentsGrid');
    if (en) en.checked = c.segments?.enabled ?? false;
    if (as) as.checked = c.segments?.autoSkip ?? false;
    if (sn) sn.checked = c.segments?.showNotifications ?? true;
    if (sm) sm.checked = c.segments?.showMarkers ?? true;
    if (st) {
      st.value = c.segments?.skipTolerance ?? 0.5;
      if (stv) stv.textContent = `${st.value}s`;
    }
    if (msd) {
      msd.value = c.segments?.minSegmentDuration ?? 1;
      if (msdv) msdv.textContent = `${msd.value}s`;
    }
    if (g) this.render(g);
    if (en) on(en, 'change', e => this.a.save('segments.enabled', e.target.checked));
    if (as) on(as, 'change', e => this.a.save('segments.autoSkip', e.target.checked));
    if (sn) on(sn, 'change', e => this.a.save('segments.showNotifications', e.target.checked));
    if (sm) on(sm, 'change', e => this.a.save('segments.showMarkers', e.target.checked));
    if (st)
      on(st, 'input', () => {
        if (stv) stv.textContent = `${st.value}s`;
        this.a.save('segments.skipTolerance', pf(st.value));
      });
    if (msd)
      on(msd, 'input', () => {
        if (msdv) msdv.textContent = `${msd.value}s`;
        this.a.save('segments.minSegmentDuration', pf(msd.value));
      });
    const ib = i('#ignoreAllBtn'),
      sb = i('#skipAllBtn'),
      sp = i('#speedAllBtn'),
      rb = i('#resetAllBtn');
    if (ib) on(ib, 'click', () => this.setAll('ignore'));
    if (sb) on(sb, 'click', () => this.setAll('skip'));
    if (sp) on(sp, 'click', () => this.setAll('speed'));
    if (rb) on(rb, 'click', () => this.resetToDefaults());
  }
  render(g) {
    const t = i('#segmentItemTemplate');
    g.innerHTML = '';
    const c = this.s.get().segments?.categories || {};
    SEGMENT_CATEGORIES.forEach(cat => {
      const cl = t.content.cloneNode(true),
        item = cl.querySelector('.segment-item'),
        co = cl.querySelector('.segment-color'),
        n = cl.querySelector('.segment-name'),
        a = cl.querySelector('.segment-action'),
        sc = cl.querySelector('.speed-control'),
        ss = cl.querySelector('.speed-slider'),
        sv = cl.querySelector('.speed-value');
      item.dataset.category = cat.id;
      co.style.backgroundColor = cat.color;
      n.textContent = cat.label;
      const cfg = c[cat.id] || { ...DEFAULT_SEGMENT_CONFIG };
      a.value = cfg.action;
      ss.value = cfg.speed;
      sv.textContent = `${cfg.speed}x`;
      if (cat.id === 'content') {
        a.disabled = false;
        item.classList.add('content-segment');
        const desc = cl.querySelector('.segment-description');
        if (desc) desc.textContent = 'Main video content - can adjust speed but NEVER skipped';
      }
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
      if (cat.id === 'content') return;
      if (!cats[cat.id]) cats[cat.id] = { ...DEFAULT_SEGMENT_CONFIG };
      cats[cat.id] = { ...cats[cat.id], action: a };
    });
    this.s.set('segments.categories', cats);
    await this.s.save();
    const g = i('#segmentsGrid');
    if (g) this.render(g);
  }
  async resetToDefaults() {
    const defaults = this.s.getDefaults();
    this.s.set('segments.categories', defaults.segments.categories);
    await this.s.save();
    const g = i('#segmentsGrid');
    if (g) this.render(g);
  }
}
