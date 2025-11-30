import { SEGMENT_CATEGORIES, DEFAULT_SEGMENT_CONFIG } from './settings-manager.js';
import { qs as i, on } from '../../utils/shortcuts/dom.js';
import { pf } from '../../utils/shortcuts/global.js';
import { stc, ih, ac } from '../../utils/shortcuts.js';
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
      if (stv) stc(stv, `${st.value}s`);
    }
    if (msd) {
      msd.value = c.segments?.minSegmentDuration ?? 1;
      if (msdv) stc(msdv, `${msd.value}s`);
    }

    if (g) this.render(g);

    // Use SettingsManager directly for immediate updates where appropriate,
    // or AutoSave if debouncing is desired. For toggles, immediate is usually better for settings pages.
    if (en)
      on(en, 'change', async e => await this.updateSetting('segments.enabled', e.target.checked));
    if (as)
      on(as, 'change', async e => await this.updateSetting('segments.autoSkip', e.target.checked));
    if (sn)
      on(
        sn,
        'change',
        async e => await this.updateSetting('segments.showNotifications', e.target.checked)
      );
    if (sm)
      on(
        sm,
        'change',
        async e => await this.updateSetting('segments.showMarkers', e.target.checked)
      );

    if (st)
      on(st, 'input', () => {
        if (stv) stc(stv, `${st.value}s`);
        // Use AutoSave for sliders to avoid spamming storage
        this.a.save('segments.skipTolerance', pf(st.value));
      });
    if (msd)
      on(msd, 'input', () => {
        if (msdv) stc(msdv, `${msd.value}s`);
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

  async updateSetting(path, value) {
    this.s.set(path, value);
    await this.s.save();
  }

  render(g) {
    const t = i('#segmentItemTemplate');
    if (!t) return;

    ih(g, '');
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

      if (!item) return;

      item.dataset.category = cat.id;
      if (co) co.style.backgroundColor = cat.color;
      if (n) stc(n, cat.label);

      const cfg = c[cat.id] || { ...DEFAULT_SEGMENT_CONFIG };

      if (a) {
        a.value = cfg.action;
        on(a, 'change', () => {
          const v = a.value;
          if (sc) {
            if (v === 'speed') sc.classList.remove('hidden');
            else sc.classList.add('hidden');
          }
          this.updateCategory(cat.id, { action: v });
        });
      }

      if (ss && sv) {
        ss.value = cfg.speed;
        stc(sv, `${cfg.speed}x`);
        on(ss, 'input', () => {
          const v = ss.value;
          stc(sv, `${v}x`);
          // Debounce speed updates if possible, or just save
          this.updateCategory(cat.id, { speed: pf(v) });
        });
      }

      if (cat.id === 'content') {
        if (a) a.disabled = false; // Allow changing action for content? Usually content is not skipped.
        // Actually, logic says "NEVER skipped". So maybe disable 'skip' option?
        // For now, keeping existing logic but ensuring class is added
        item.classList.add('content-segment');
        const desc = cl.querySelector('.segment-description');
        if (desc) stc(desc, 'Main video content - can adjust speed but NEVER skipped');
      }

      if (cfg.action === 'speed' && sc) sc.classList.remove('hidden');

      ac(g, cl);
    });
  }

  async updateCategory(id, u) {
    const c = this.s.get(),
      cats = { ...(c.segments?.categories || {}) };

    if (!cats[id]) cats[id] = { ...DEFAULT_SEGMENT_CONFIG };
    cats[id] = { ...cats[id], ...u };

    this.s.set('segments.categories', cats);
    await this.s.save();
  }

  async update(id, u) {
    return this.updateCategory(id, u);
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
