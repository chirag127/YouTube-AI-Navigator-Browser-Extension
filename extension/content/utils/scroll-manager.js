const gu = p => chrome.runtime.getURL(p);

const { qs: $, qsa: $$ } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
export class ScrollManager {
  constructor() {
    l('ScrollManager:Start');
    try {
      this.originalScrollPosition = 0;
      this.isScrolling = false;
      l('ScrollManager:End');
    } catch (err) {
      e('Err:ScrollManager', err);
    }
  }
  savePosition() {
    l('savePosition:Start');
    try {
      this.originalScrollPosition = window.scrollY;
      l('[SM] Saved pos:', this.originalScrollPosition);
      l('savePosition:End');
    } catch (err) {
      e('Err:savePosition', err);
    }
  }
  restorePosition() {
    l('restorePosition:Start');
    try {
      l('[SM] Restoring pos:', this.originalScrollPosition);
      window.scrollTo({ top: this.originalScrollPosition, behavior: 'smooth' });
      l('restorePosition:End');
    } catch (err) {
      e('Err:restorePosition', err);
    }
  }
  scrollToTop(i = false) {
    l('scrollToTop:Start');
    try {
      l('[SM] Scroll top', i ? '(inst)' : '(smth)');
      window.scrollTo({ top: 0, behavior: i ? 'auto' : 'smooth' });
      l('scrollToTop:End');
    } catch (err) {
      e('Err:scrollToTop', err);
    }
  }
  scrollToTopInstant() {
    l('scrollToTopInstant:Start');
    try {
      l('[SM] Inst scroll top');
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      l('scrollToTopInstant:End');
    } catch (err) {
      e('Err:scrollToTopInstant', err);
    }
  }
  async scrollToComments() {
    if (this.isScrolling) {
      l('[SM] Skip');
      return false;
    }
    this.isScrolling = true;
    l('[SM] Scroll comments...');
    try {
      this.savePosition();
      const cs = $('ytd-comments#comments');
      if (!cs) {
        w('[SM] No comments sec');
        this.isScrolling = false;
        return false;
      }
      cs.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await this.waitForScroll(1000);
      window.scrollBy({ top: -100, behavior: 'smooth' });
      await this.waitForScroll(500);
      l('[SM] ✅ Scrolled');
      await this.waitForCommentsToLoad();
      this.isScrolling = false;
      return true;
    } catch (x) {
      e('[SM] Err scroll:', x);
      this.isScrolling = false;
      return false;
    }
  }
  async waitForCommentsToLoad() {
    l('[SM] Wait comments...');
    const max = 5000,
      int = 200;
    let el = 0;
    while (el < max) {
      const ce = $$('ytd-comment-thread-renderer');
      if (ce.length > 0) {
        l(`[SM] ✅ Loaded: ${ce.length}`);
        return true;
      }
      await this.waitForScroll(int);
      el += int;
    }
    w('[SM] Timeout');
    return false;
  }
  async scrollToElement(sel, opt = {}) {
    l('scrollToElement:Start');
    try {
      const el = $(sel);
      if (!el) {
        l(`[SM] Not found: ${sel}`);
        l('scrollToElement:End');
        return false;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest', ...opt });
      await this.waitForScroll(1000);
      l('scrollToElement:End');
      return true;
    } catch (err) {
      e('Err:scrollToElement', err);
      return false;
    }
  }
  waitForScroll(ms) {
    l('waitForScroll:Start');
    try {
      const result = new Promise(r => to(r, ms));
      l('waitForScroll:End');
      return result;
    } catch (err) {
      e('Err:waitForScroll', err);
      return Promise.resolve();
    }
  }
  isInViewport(el) {
    l('isInViewport:Start');
    try {
      const r = el.getBoundingClientRect();
      const result =
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        r.right <= (window.innerWidth || document.documentElement.clientWidth);
      l('isInViewport:End');
      return result;
    } catch (err) {
      e('Err:isInViewport', err);
      return false;
    }
  }
  ensureVisible(el) {
    l('ensureVisible:Start');
    try {
      if (!this.isInViewport(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      l('ensureVisible:End');
    } catch (err) {
      e('Err:ensureVisible', err);
    }
  }
}
let sm = null;
export function getScrollManager() {
  l('getScrollManager:Start');
  try {
    if (!sm) sm = new ScrollManager();
    l('getScrollManager:End');
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
