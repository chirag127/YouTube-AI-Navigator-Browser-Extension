import { id, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';

export class UIAppearance {
  constructor(sm, as) {
    this.sm = sm;
    this.as = as;
  }

  init() {
    try {
      this.loadSettings();
      this.attachListeners();
    } catch (err) {
      e('[UIAppearance] Init error:', err);
    }
  }

  loadSettings() {
    try {
      const c = this.sm.get('ui') || {};
      const ff = id('uiFontFamily');
      const is = id('uiIconStyle');

      if (ff) ff.value = c.fontFamily || 'Inter';
      if (is) is.value = c.iconStyle || 'default';
    } catch (err) {
      e('[UIAppearance] Load error:', err);
    }
  }

  attachListeners() {
    try {
      const ff = id('uiFontFamily');
      const is = id('uiIconStyle');

      if (ff) on(ff, 'change', e => this.as.save('ui.fontFamily', e.target.value));
      if (is) on(is, 'change', e => this.as.save('ui.iconStyle', e.target.value));
    } catch (err) {
      e('[UIAppearance] Attach listeners error:', err);
    }
  }
}
