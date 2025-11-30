import { id, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';

export class WidgetSettings {
  constructor(sm, nm) {
    this.sm = sm;
    this.nm = nm;
  }
  init() {
    try {
      this.loadSettings();
      this.attachListeners();
    } catch (err) {
      e('[WidgetSettings] Init error:', err);
    }
  }
  loadSettings() {
    try {
      const cfg = this.sm.get('widget') || {};
      const h = id('widget-height');
      const mh = id('widget-min-height');
      const xh = id('widget-max-height');
      const w = id('widget-width');
      const mw = id('widget-min-width');
      const xw = id('widget-max-width');
      const r = id('widget-resizable');
      const rw = id('widget-resizable-width');
      const pos = id('widget-position');
      const op = id('widget-opacity');
      const bl = id('widget-blur');
      const sc = id('widget-scale');
      const dh = id('widget-dynamic-height');
      const vm = id('widget-viewport-margin');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      const dc = id('widget-default-collapsed');
      const rs = id('widget-remember-state');
      const wop = id('widgetOpacity');
      const wbr = id('widgetBorderRadius');
      const wac = id('widgetAccentColor');
      const whc = id('widgetHideOnChannels');
      const wopv = id('widgetOpacityValue');
      const wbrv = id('widgetBorderRadiusValue');
      const wacv = id('widgetAccentColorValue');

      // Segment type filters
      const ss = id('widget-show-sponsor');
      const sp = id('widget-show-selfpromo');
      const si = id('widget-show-interaction');
      const sin = id('widget-show-intro');
      const so = id('widget-show-outro');
      const spr = id('widget-show-preview');
      const sf = id('widget-show-filler');
      const sh = id('widget-show-highlight');
      const se = id('widget-show-exclusive');

      if (h) h.value = cfg.height || 500;
      if (mh) mh.value = cfg.minHeight || 200;
      if (xh) xh.value = cfg.maxHeight || 1200;
      if (w) w.value = cfg.width || 400;
      if (mw) mw.value = cfg.minWidth || 300;
      if (xw) xw.value = cfg.maxWidth || 800;
      if (r) r.checked = cfg.resizable !== false;
      if (rw) rw.checked = cfg.resizableWidth === true;
      if (pos) pos.value = cfg.position || 'right';
      if (op) op.value = cfg.opacity || 95;
      if (bl) bl.value = cfg.blur || 12;
      if (sc) sc.value = cfg.scale || 100;
      if (dh) dh.checked = cfg.dynamicHeight !== false;
      if (vm) vm.value = cfg.viewportMargin || 20;
      if (ts) ts.checked = cfg.tabs?.summary !== false;
      if (tg) tg.checked = cfg.tabs?.segments !== false;
      if (tc) tc.checked = cfg.tabs?.chat !== false;
      if (tm) tm.checked = cfg.tabs?.comments !== false;
      if (dc) dc.checked = cfg.defaultCollapsed === true;
      if (rs) rs.checked = cfg.rememberState !== false;
      if (wop) {
        wop.value = cfg.opacity !== undefined ? cfg.opacity : 95;
        if (wopv) wopv.textContent = `${wop.value}%`;
      }
      if (wbr) {
        wbr.value = cfg.borderRadius !== undefined ? cfg.borderRadius : 12;
        if (wbrv) wbrv.textContent = `${wbr.value}px`;
      }
      if (wac) {
        wac.value = cfg.accentColor || '#3ea6ff';
        if (wacv) wacv.textContent = wac.value;
      }
      if (whc) whc.value = (cfg.hideOnChannels || []).join(', ');

      // Load segment filters (default to true)
      const filters = cfg.segmentFilters || {};
      if (ss) ss.checked = filters.sponsor !== false;
      if (sp) sp.checked = filters.selfpromo !== false;
      if (si) si.checked = filters.interaction !== false;
      if (sin) sin.checked = filters.intro !== false;
      if (so) so.checked = filters.outro !== false;
      if (spr) spr.checked = filters.preview !== false;
      if (sf) sf.checked = filters.filler !== false;
      if (sh) sh.checked = filters.highlight !== false;
      if (se) se.checked = filters.exclusive !== false;
    } catch (err) {
      e('[WidgetSettings] Load error:', err);
    }
  }
  attachListeners() {
    try {
      const h = id('widget-height');
      const mh = id('widget-min-height');
      const xh = id('widget-max-height');
      const w = id('widget-width');
      const mw = id('widget-min-width');
      const xw = id('widget-max-width');
      const r = id('widget-resizable');
      const rw = id('widget-resizable-width');
      const pos = id('widget-position');
      const op = id('widget-opacity');
      const bl = id('widget-blur');
      const sc = id('widget-scale');
      const dh = id('widget-dynamic-height');
      const vm = id('widget-viewport-margin');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      const dc = id('widget-default-collapsed');
      const rs = id('widget-remember-state');
      const wop = id('widgetOpacity');
      const wbr = id('widgetBorderRadius');
      const wac = id('widgetAccentColor');
      const whc = id('widgetHideOnChannels');
      const wopv = id('widgetOpacityValue');
      const wbrv = id('widgetBorderRadiusValue');
      const wacv = id('widgetAccentColorValue');
      const rb = id('widget-reset');

      // Segment filters
      const filters = [
        'sponsor',
        'selfpromo',
        'interaction',
        'intro',
        'outro',
        'preview',
        'filler',
        'highlight',
        'exclusive',
      ];

      if (h) on(h, 'change', () => this.save());
      if (mh) on(mh, 'change', () => this.save());
      if (xh) on(xh, 'change', () => this.save());
      if (w) on(w, 'change', () => this.save());
      if (mw) on(mw, 'change', () => this.save());
      if (xw) on(xw, 'change', () => this.save());
      if (r) on(r, 'change', () => this.save());
      if (rw) on(rw, 'change', () => this.save());
      if (pos) on(pos, 'change', () => this.save());
      if (op) on(op, 'change', () => this.save());
      if (bl) on(bl, 'change', () => this.save());
      if (sc) on(sc, 'change', () => this.save());
      if (dh) on(dh, 'change', () => this.save());
      if (vm) on(vm, 'change', () => this.save());
      if (ts) on(ts, 'change', () => this.save());
      if (tg) on(tg, 'change', () => this.save());
      if (tc) on(tc, 'change', () => this.save());
      if (tm) on(tm, 'change', () => this.save());
      if (dc) on(dc, 'change', () => this.save());
      if (rs) on(rs, 'change', () => this.save());
      if (wop) {
        on(wop, 'input', e => {
          if (wopv) wopv.textContent = `${e.target.value}%`;
        });
        on(wop, 'change', () => this.save());
      }
      if (wbr) {
        on(wbr, 'input', e => {
          if (wbrv) wbrv.textContent = `${e.target.value}px`;
        });
        on(wbr, 'change', () => this.save());
      }
      if (wac) {
        on(wac, 'input', e => {
          if (wacv) wacv.textContent = e.target.value;
        });
        on(wac, 'change', () => this.save());
      }
      if (whc) on(whc, 'change', () => this.save());

      // Attach listeners for all segment filters
      filters.forEach(f => {
        const el = id(`widget-show-${f}`);
        if (el) on(el, 'change', () => this.save());
      });

      if (rb) on(rb, 'click', () => this.reset());
    } catch (err) {
      e('[WidgetSettings] Attach listeners error:', err);
    }
  }
  async save() {
    try {
      const h = id('widget-height');
      const mh = id('widget-min-height');
      const xh = id('widget-max-height');
      const w = id('widget-width');
      const mw = id('widget-min-width');
      const xw = id('widget-max-width');
      const r = id('widget-resizable');
      const rw = id('widget-resizable-width');
      const pos = id('widget-position');
      const op = id('widget-opacity');
      const bl = id('widget-blur');
      const sc = id('widget-scale');
      const dh = id('widget-dynamic-height');
      const vm = id('widget-viewport-margin');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      const dc = id('widget-default-collapsed');
      const rs = id('widget-remember-state');

      this.sm.set('widget.height', parseInt(h?.value || 500));
      this.sm.set('widget.minHeight', parseInt(mh?.value || 200));
      this.sm.set('widget.maxHeight', parseInt(xh?.value || 1200));
      this.sm.set('widget.width', parseInt(w?.value || 400));
      this.sm.set('widget.minWidth', parseInt(mw?.value || 300));
      this.sm.set('widget.maxWidth', parseInt(xw?.value || 800));
      this.sm.set('widget.resizable', r?.checked !== false);
      this.sm.set('widget.resizableWidth', rw?.checked === true);
      this.sm.set('widget.position', pos?.value || 'right');
      this.sm.set('widget.opacity', parseInt(op?.value || 95));
      this.sm.set('widget.blur', parseInt(bl?.value || 12));
      this.sm.set('widget.scale', parseInt(sc?.value || 100));
      this.sm.set('widget.dynamicHeight', dh?.checked !== false);
      this.sm.set('widget.viewportMargin', parseInt(vm?.value || 20));
      this.sm.set('widget.tabs.summary', ts?.checked !== false);
      this.sm.set('widget.tabs.segments', tg?.checked !== false);
      this.sm.set('widget.tabs.chat', tc?.checked !== false);
      this.sm.set('widget.tabs.comments', tm?.checked !== false);
      this.sm.set('widget.defaultCollapsed', dc?.checked === true);
      this.sm.set('widget.rememberState', rs?.checked !== false);

      const wop = id('widgetOpacity');
      const wbr = id('widgetBorderRadius');
      const wac = id('widgetAccentColor');
      const whc = id('widgetHideOnChannels');

      this.sm.set('widget.opacity', parseInt(wop?.value || 95));
      this.sm.set('widget.borderRadius', parseInt(wbr?.value || 12));
      this.sm.set('widget.accentColor', wac?.value || '#3ea6ff');

      const channels = (whc?.value || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      this.sm.set('widget.hideOnChannels', channels);

      // Save segment filters
      const filters = {
        sponsor: id('widget-show-sponsor')?.checked !== false,
        selfpromo: id('widget-show-selfpromo')?.checked !== false,
        interaction: id('widget-show-interaction')?.checked !== false,
        intro: id('widget-show-intro')?.checked !== false,
        outro: id('widget-show-outro')?.checked !== false,
        preview: id('widget-show-preview')?.checked !== false,
        filler: id('widget-show-filler')?.checked !== false,
        highlight: id('widget-show-highlight')?.checked !== false,
        exclusive: id('widget-show-exclusive')?.checked !== false,
      };
      this.sm.set('widget.segmentFilters', filters);

      await this.sm.save();
      this.nm.show('Widget settings saved', 'success');
    } catch (err) {
      e('[WidgetSettings] Save error:', err);
      this.nm.show('Failed to save widget settings', 'error');
    }
  }
  async reset() {
    try {
      this.sm.set('widget', {
        height: 500,
        minHeight: 200,
        maxHeight: 1200,
        width: 400,
        minWidth: 300,
        maxWidth: 800,
        resizable: true,
        resizableWidth: false,
        position: 'right',
        opacity: 95,
        blur: 12,
        scale: 100,
        dynamicHeight: true,
        viewportMargin: 20,
        tabs: { summary: true, segments: true, chat: true, comments: true },
        defaultCollapsed: false,
        rememberState: true,
        segmentFilters: {
          sponsor: true,
          selfpromo: true,
          interaction: true,
          intro: true,
          outro: true,
          preview: true,
          filler: true,
          highlight: true,
          exclusive: true,
        },

        borderRadius: 12,
        accentColor: '#3ea6ff',
        hideOnChannels: [],
      });
      await this.sm.save();
      this.loadSettings();
      this.nm.show('Widget settings reset to defaults', 'success');
    } catch (err) {
      e('[WidgetSettings] Reset error:', err);
      this.nm.show('Failed to reset widget settings', 'error');
    }
  }
}
