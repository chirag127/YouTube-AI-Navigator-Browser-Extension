import { qs as i } from '../../utils/shortcuts/dom.js';
import { pi } from '../../utils/shortcuts/global.js';
export class ScrollSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const c = this.s.get(),
      sc = c.scroll || {},
      ui = c.ui || {};
    this.chk('autoScrollToComments', sc.autoScrollToComments ?? false);
    this.chk('scrollBackAfterComments', sc.scrollBackAfterComments ?? true);
    this.chk('showScrollNotification', sc.showScrollNotification ?? true);
    this.chk('smoothScroll', sc.smoothScroll ?? true);
    this.set('scrollSpeed', sc.scrollSpeed || 'medium');
    this.set('autoScrollDelay', sc.autoScrollDelay || 500);
    this.set('uiTheme', ui.theme || 'dark');
    this.set('uiFontSize', ui.fontSize || 'medium');
    this.chk('uiAnimationsEnabled', ui.animationsEnabled ?? true);
    this.chk('uiShowTooltips', ui.showTooltips ?? true);
    this.chk('uiCompactMode', ui.compactMode ?? false);
    this.a.attachToAll({
      autoScrollToComments: { path: 'scroll.autoScrollToComments' },
      scrollBackAfterComments: { path: 'scroll.scrollBackAfterComments' },
      showScrollNotification: { path: 'scroll.showScrollNotification' },
      smoothScroll: { path: 'scroll.smoothScroll' },
      scrollSpeed: { path: 'scroll.scrollSpeed' },
      autoScrollDelay: { path: 'scroll.autoScrollDelay', transform: v => pi(v) },
      uiTheme: { path: 'ui.theme' },
      uiFontSize: { path: 'ui.fontSize' },
      uiAnimationsEnabled: { path: 'ui.animationsEnabled' },
      uiShowTooltips: { path: 'ui.showTooltips' },
      uiCompactMode: { path: 'ui.compactMode' },
    });
  }
  set(id, v) {
    const el = i(`#${id}`);
    if (el) el.value = v;
  }
  chk(id, v) {
    const el = i(`#${id}`);
    if (el) el.checked = v;
  }
}
