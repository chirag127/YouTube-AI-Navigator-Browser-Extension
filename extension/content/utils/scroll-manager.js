import { qs as $, qsa as $$ } from '../../utils/shortcuts/dom.js';
import { l, w, e } from '../../utils/shortcuts/log.js';
import { st } from '../../utils/shortcuts/time.js';

export class ScrollManager {
  constructor() {
    this.originalScrollPosition = 0;
    this.isScrolling = false;
  }
  savePosition() {
    this.originalScrollPosition = window.scrollY;
    l('[ScrollManager] Saved scroll position:', this.originalScrollPosition);
  }
  restorePosition() {
    l('[ScrollManager] Restoring scroll position:', this.originalScrollPosition);
    window.scrollTo({ top: this.originalScrollPosition, behavior: 'smooth' });
  }
  scrollToTop(i = false) {
    l('[ScrollManager] Scrolling to top', i ? '(instant)' : '(smooth)');
    window.scrollTo({ top: 0, behavior: i ? 'auto' : 'smooth' });
  }
  scrollToTopInstant() {
    l('[ScrollManager] Instant scroll to top');
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  async scrollToComments() {
    if (this.isScrolling) {
      w('[ScrollManager] Already scrolling, skipping');
      return false;
    }
    this.isScrolling = true;
    l('[ScrollManager] 📜 Scrolling to comments section...');
    try {
      this.savePosition();
      const cs = $('ytd-comments#comments');
      if (!cs) {
        w('[ScrollManager] ⚠️ Comments section not found');
        this.isScrolling = false;
        return false;
      }
      cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await this.waitForScroll(1000);
      window.scrollBy({ top: -100, behavior: 'smooth' });
      await this.waitForScroll(500);
      l('[ScrollManager] ✅ Scrolled to comments section');
      await this.waitForCommentsToLoad();
      this.isScrolling = false;
      return true;
    } catch (x) {
      e('[ScrollManager] ❌ Error scrolling to comments:', x);
      this.isScrolling = false;
      return false;
    }
  }
  async waitForCommentsToLoad() {
    l('[ScrollManager] Waiting for comments to load...');
    const max = 5000,
      int = 200;
    let el = 0;
    while (el < max) {
      const ce = $$('ytd-comment-thread-renderer');
      if (ce.length > 0) {
        l(`[ScrollManager] ✅ Comments loaded: ${ce.length} found`);
        return true;
      }
      await this.waitForScroll(int);
      el += int;
    }
    w('[ScrollManager] ⚠️ Timeout waiting for comments to load');
    return false;
  }
  async scrollToElement(sel, opt = {}) {
    const el = $(sel);
    if (!el) {
      w(`[ScrollManager] Element not found: ${sel}`);
      return false;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest', ...opt });
    await this.waitForScroll(1000);
    return true;
  }
  waitForScroll(ms) {
    return new Promise(r => st(r, ms));
  }
  isInViewport(el) {
    const r = el.getBoundingClientRect();
    return (
      r.top >= 0 &&
      r.left >= 0 &&
      r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      r.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  ensureVisible(el) {
    if (!this.isInViewport(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
let sm = null;
export function getScrollManager() {
  if (!sm) sm = new ScrollManager();
  return sm;
}
export const scrollToComments = () => getScrollManager().scrollToComments();
export const scrollToTop = (i = false) => getScrollManager().scrollToTop(i);
export const scrollToTopInstant = () => getScrollManager().scrollToTopInstant();
export const saveScrollPosition = () => getScrollManager().savePosition();
export const restoreScrollPosition = () => getScrollManager().restorePosition();
