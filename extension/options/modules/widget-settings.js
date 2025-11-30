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
      const r = id('widget-resizable');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      if (h) h.value = cfg.height || 500;
      if (mh) mh.value = cfg.minHeight || 200;
      if (xh) xh.value = cfg.maxHeight || 1200;
      if (r) r.checked = cfg.resizable !== false;
      if (ts) ts.checked = cfg.tabs?.summary !== false;
      if (tg) tg.checked = cfg.tabs?.segments !== false;
      if (tc) tc.checked = cfg.tabs?.chat !== false;
      if (tm) tm.checked = cfg.tabs?.comments !== false;
    } catch (err) {
      e('[WidgetSettings] Load error:', err);
    }
  }
  attachListeners() {
    try {
      const h = id('widget-height');
      const mh = id('widget-min-height');
      const xh = id('widget-max-height');
      const r = id('widget-resizable');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      const rb = id('widget-reset');
      if (h) on(h, 'change', () => this.save());
      if (mh) on(mh, 'change', () => this.save());
      if (xh) on(xh, 'change', () => this.save());
      if (r) on(r, 'change', () => this.save());
      if (ts) on(ts, 'change', () => this.save());
      if (tg) on(tg, 'change', () => this.save());
      if (tc) on(tc, 'change', () => this.save());
      if (tm) on(tm, 'change', () => this.save());
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
      const r = id('widget-resizable');
      const ts = id('widget-tab-summary');
      const tg = id('widget-tab-segments');
      const tc = id('widget-tab-chat');
      const tm = id('widget-tab-comments');
      this.sm.set('widget.height', parseInt(h?.value || 500));
      this.sm.set('widget.minHeight', parseInt(mh?.value || 200));
      this.sm.set('widget.maxHeight', parseInt(xh?.value || 1200));
      this.sm.set('widget.resizable', r?.checked !== false);
      this.sm.set('widget.tabs.summary', ts?.checked !== false);
      this.sm.set('widget.tabs.segments', tg?.checked !== false);
      this.sm.set('widget.tabs.chat', tc?.checked !== false);
      this.sm.set('widget.tabs.comments', tm?.checked !== false);
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
        resizable: true,
        tabs: { summary: true, segments: true, chat: true, comments: true },
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
