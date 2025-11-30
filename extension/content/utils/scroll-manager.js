const gu = p => chrome.runtime.getURL(p);

const { qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { e, w } = await import(gu('utils/shortcuts/log.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
export class ScrollManager {
  constructor() {
    try {
      this.originalScrollPosition = 0;
      this.isScrolling = false;
    } catch (err) {
      e('Err:ScrollManager', err);
    }
  }
  savePosition() {
    try {
      this.originalScrollPosition = window.scrollY;
    } catch (err) {
      e('Err:savePosition', err);
    }
  }
  restorePosition() {
    try {
      window.scrollTo({ top: this.originalScrollPosition, behavior: 'smooth' });
    } catch (err) {
      e('Err:restorePosition', err);
    }
  }
  scrollToTop(i = false) {
    try {
      window.scrollTo({ top: 0, behavior: i ? 'auto' : 'smooth' });
    } catch (err) {
      e('Err:scrollToTop', err);
    }
  }
  scrollToTopInstant() {
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (err) {
      e('Err:scrollToTopInstant', err);
    }
  }
  async scrollToComments() {
    if (this.isScrolling) return false;
    this.isScrolling = true;
    try {
      this.savePosition();
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      await this.waitForScroll(3000);
      this.restorePosition();
      await this.waitForScroll(2000);
      const loaded = await this.waitForCommentsToLoad();
      this.isScrolling = false;
      return loaded;
    } catch (x) {
      e('[SM] Err scroll:', x);
      this.isScrolling = false;
      return false;
    }
  }
  async waitForCommentsToLoad() {
    const max = 8000,
      int = 300;
    let el = 0;
    while (el < max) {
      const ce = $$('ytd-comment-thread-renderer');
      if (ce.length > 0) {
        let loaded = false;
        for (let i = 0; i < Math.min(ce.length, 5); i++) {
          const c = ce[i];
          const a = c.querySelector('#author-text')?.textContent?.trim();
          const t = c.querySelector('#content-text')?.textContent?.trim();
          if (a && t) {
            loaded = true;
            break;
          }
        }
        if (loaded) return true;
      }
      await this.waitForScroll(int);
      el += int;
    }
    w('[SM] Timeout waiting for comments');
    return false;
  }
  async scrollToElement(sel, opt = {}) {
    try {
      const el = $(sel);
      if (!el) return false;
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest', ...opt });
      await this.waitForScroll(1000);
      return true;
    } catch (err) {
      e('Err:scrollToElement', err);
      return false;
    }
  }
  waitForScroll(ms) {
    try {
      return new Promise(r => to(r, ms));
    } catch (err) {
      e('Err:waitForScroll', err);
      return Promise.resolve();
    }
  }
  isInViewport(el) {
    try {
      const r = el.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        r.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    } catch (err) {
      e('Err:isInViewport', err);
      return false;
    }
  }
  ensureVisible(el) {
    try {
      if (!this.isInViewport(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      e('Err:ensureVisible', err);
    }
  }
}
let sm = null;
export function getScrollManager() {
  try {
    if (!sm) sm = new ScrollManager();
    return sm;
  } catch (err) {
    e('Err:getScrollManager', err);
    return null;
  }
}
export const scrollToComments = () => getScrollManager().scrollToComments();
export const scrollToTop = (i = false) => getScrollManager().scrollToTop(i);
export const scrollToTopInstant = () => getScrollManager().scrollToTopInstant();
export const saveScrollPosition = () => getScrollManager().savePosition();
export const restoreScrollPosition = () => getScrollManager().restorePosition();
