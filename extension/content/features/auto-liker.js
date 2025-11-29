import { state } from '../core/state.js';
import { log, logError } from '../core/debug.js';
import { $, $$, on, off, loc } from '../utils/shortcuts.js';

export class AutoLiker {
  constructor() {
    this.video = null;
    this.likedVideos = new Set();
    this.checkInterval = null;
    this.isObserving = false;
  }

  init() {
    log('AutoLiker: Initializing...');
    this.startObserving();
  }

  startObserving() {
    if (this.isObserving) return;
    const o = new MutationObserver(() => {
      const v = $('video');
      if (v && v !== this.video) this.attachToVideo(v);
    });
    o.observe(document.body, { childList: true, subtree: true });
    this.isObserving = true;
    const v = $('video');
    if (v) this.attachToVideo(v);
  }

  attachToVideo(v) {
    if (this.video) off(this.video, 'timeupdate', this.handleTimeUpdate);
    this.video = v;
    on(this.video, 'timeupdate', this.handleTimeUpdate.bind(this));
    log('AutoLiker: Attached to video element');
    const vid = state.currentVideoId || new URLSearchParams(loc.search).get('v');
    if (vid && !this.likedVideos.has(vid)) log(`AutoLiker: New video detected (${vid})`);
  }

  async handleTimeUpdate() {
    if (!state.settings.autoLike || !this.video) return;
    const vid = state.currentVideoId || new URLSearchParams(loc.search).get('v');
    if (!vid || this.likedVideos.has(vid)) return;
    const d = this.video.duration;
    const c = this.video.currentTime;
    if (!d || d === 0) return;
    const p = (c / d) * 100;
    const t = state.settings.autoLikeThreshold || 50;
    if (p >= t) await this.attemptLike(vid);
  }

  async attemptLike(vid) {
    if (this.likedVideos.has(vid)) return;
    log(
      `AutoLiker: Threshold reached (${state.settings.autoLikeThreshold}%). Checking criteria...`
    );
    try {
      const live = this.isLiveStream();
      if (live && !state.settings.autoLikeLive) {
        log('AutoLiker: Skipping - Live stream auto-like disabled');
        this.likedVideos.add(vid);
        return;
      }
      if (!state.settings.likeIfNotSubscribed) {
        const sub = await this.checkSubscriptionStatus();
        if (!sub) {
          log("AutoLiker: Skipping - Not subscribed and 'Like if not subscribed' is disabled");
          this.likedVideos.add(vid);
          return;
        }
      }
      const s = await this.clickLikeButton();
      if (s) {
        log('AutoLiker: Video liked successfully! 👍');
        this.likedVideos.add(vid);
      }
    } catch (e) {
      logError('AutoLiker: Error during like attempt', e);
    }
  }

  isLiveStream() {
    const b = $('.ytp-live-badge');
    if (b && window.getComputedStyle(b).display !== 'none') return true;
    if (this.video && this.video.duration === Infinity) return true;
    return false;
  }

  async checkSubscriptionStatus() {
    const s = [
      '#subscribe-button > ytd-subscribe-button-renderer',
      'ytd-reel-player-overlay-renderer #subscribe-button',
      '#subscribe-button',
    ];
    let b = null;
    for (const sel of s) {
      b = $(sel);
      if (b) break;
    }
    if (!b) {
      log('AutoLiker: Subscribe button not found, assuming not subscribed');
      return false;
    }
    return (
      b.hasAttribute('subscribed') || b.querySelector("button[aria-label^='Unsubscribe']") !== null
    );
  }

  async clickLikeButton() {
    const s = [
      'like-button-view-model button',
      '#menu .YtLikeButtonViewModelHost button',
      '#segmented-like-button button',
      '#like-button button',
      'ytd-toggle-button-renderer#like-button button',
    ];
    let lb = null;
    for (const sel of s) {
      const btns = $$(sel);
      for (const b of btns) {
        if (b.closest('#top-level-buttons-computed') || b.closest('#actions')) {
          lb = b;
          break;
        }
      }
      if (lb) break;
    }
    if (!lb) {
      log('AutoLiker: Like button not found');
      return false;
    }
    const lkd =
      lb.getAttribute('aria-pressed') === 'true' || lb.classList.contains('style-default-active');
    if (lkd) {
      log('AutoLiker: Video already liked');
      this.likedVideos.add(state.currentVideoId || new URLSearchParams(loc.search).get('v'));
      return true;
    }
    lb.click();
    return true;
  }
}

export const autoLiker = new AutoLiker();
