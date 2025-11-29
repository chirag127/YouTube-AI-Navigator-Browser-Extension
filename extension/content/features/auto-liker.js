const gu = p => chrome.runtime.getURL(p);

const { state } = await import(gu('content/core/state.js'));
const { ae, re, qs, qsa } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
export class AutoLiker {
  constructor() {
    this.video = null;
    this.likedVideos = new Set();
    this.checkInterval = null;
    this.isObserving = false;
  }
  init() {
    l('init:Start');
    try {
      this.startObserving();
      l('init:End');
    } catch (err) {
      e('Err:init', err);
    }
  }
  startObserving() {
    l('startObserving:Start');
    try {
      if (this.isObserving) return;
      const o = new MutationObserver(() => {
        const v = qs('video');
        if (v && v !== this.video) this.attachToVideo(v);
      });
      o.observe(document.body, { childList: true, subtree: true });
      this.isObserving = true;
      const v = qs('video');
      if (v) this.attachToVideo(v);
      l('startObserving:End');
    } catch (err) {
      e('Err:startObserving', err);
    }
  }
  attachToVideo(v) {
    l('attachToVideo:Start');
    try {
      if (this.video) re(this.video, 'timeupdate', this.handleTimeUpdate);
      this.video = v;
      ae(this.video, 'timeupdate', this.handleTimeUpdate.bind(this));
      const vid = state.currentVideoId || new URLSearchParams(location.search).get('v');
      if (vid && !this.likedVideos.has(vid)) l(`AL: New vid ${vid}`);
      l('attachToVideo:End');
    } catch (err) {
      e('Err:attachToVideo', err);
    }
  }
  async handleTimeUpdate() {
    l('handleTimeUpdate:Start');
    try {
      if (!state.settings.autoLike || !this.video) return;
      const vid = state.currentVideoId || new URLSearchParams(location.search).get('v');
      if (!vid || this.likedVideos.has(vid)) return;
      const d = this.video.duration;
      const c = this.video.currentTime;
      if (!d || d === 0) return;
      const p = (c / d) * 100;
      const t = state.settings.autoLikeThreshold || 50;
      if (p >= t) await this.attemptLike(vid);
      l('handleTimeUpdate:End');
    } catch (err) {
      e('Err:handleTimeUpdate', err);
    }
  }
  async attemptLike(vid) {
    l('attemptLike:Start');
    try {
      if (this.likedVideos.has(vid)) return;
      const live = this.isLiveStream();
      if (live && !state.settings.autoLikeLive) {
        this.likedVideos.add(vid);
        l('attemptLike:End');
        return;
      }
      if (!state.settings.likeIfNotSubscribed) {
        const sub = await this.checkSubscriptionStatus();
        if (!sub) {
          this.likedVideos.add(vid);
          l('attemptLike:End');
          return;
        }
      }
      const s = await this.clickLikeButton();
      if (s) {
        this.likedVideos.add(vid);
      }
      l('attemptLike:End');
    } catch (err) {
      e('Err:attemptLike', err);
    }
  }
  isLiveStream() {
    l('isLiveStream:Start');
    try {
      const b = qs('.ytp-live-badge');
      if (b && window.getComputedStyle(b).display !== 'none') {
        l('isLiveStream:End');
        return true;
      }
      if (this.video && this.video.duration === Infinity) {
        l('isLiveStream:End');
        return true;
      }
      l('isLiveStream:End');
      return false;
    } catch (err) {
      e('Err:isLiveStream', err);
      return false;
    }
  }
  async checkSubscriptionStatus() {
    l('checkSubscriptionStatus:Start');
    try {
      const s = [
        '#subscribe-button > ytd-subscribe-button-renderer',
        'ytd-reel-player-overlay-renderer #subscribe-button',
        '#subscribe-button',
      ];
      let b = null;
      for (const sel of s) {
        b = qs(sel);
        if (b) break;
      }
      if (!b) {
        l('checkSubscriptionStatus:End');
        return false;
      }
      const result =
        b.hasAttribute('subscribed') ||
        b.querySelector("button[aria-label^='Unsubscribe']") !== null;
      l('checkSubscriptionStatus:End');
      return result;
    } catch (err) {
      e('Err:checkSubscriptionStatus', err);
      return false;
    }
  }
  async clickLikeButton() {
    l('clickLikeButton:Start');
    try {
      const s = [
        'like-button-view-model button',
        '#menu .YtLikeButtonViewModelHost button',
        '#segmented-like-button button',
        '#like-button button',
        'ytd-toggle-button-renderer#like-button button',
      ];
      let lb = null;
      for (const sel of s) {
        const btns = qsa(sel);
        for (const b of btns) {
          if (b.closest('#top-level-buttons-computed') || b.closest('#actions')) {
            lb = b;
            break;
          }
        }
        if (lb) break;
      }
      if (!lb) {
        l('clickLikeButton:End');
        return false;
      }
      const lkd =
        lb.getAttribute('aria-pressed') === 'true' || lb.classList.contains('style-default-active');
      if (lkd) {
        this.likedVideos.add(state.currentVideoId || new URLSearchParams(location.search).get('v'));
        l('clickLikeButton:End');
        return true;
      }
      lb.click();
      l('clickLikeButton:End');
      return true;
    } catch (err) {
      e('Err:clickLikeButton', err);
      return false;
    }
  }
}
export const autoLiker = new AutoLiker();
