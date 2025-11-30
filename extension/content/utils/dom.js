const gu = p => chrome.runtime.getURL(p);
const { e } = await import(gu('utils/shortcuts/log.js'));
const { ce, qs } = await import(gu('utils/shortcuts/dom.js'));
export function findSecondaryColumn() {
  try {
    const s = [
      '#secondary-inner',
      '#secondary',
      '#related',
      'ytd-watch-next-secondary-results-renderer',
      '#columns #secondary',
      'ytd-watch-flexy #secondary',
    ];
    for (const sel of s) {
      const el = qs(sel);
      if (el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)) {
        return el;
      }
    }
    for (const sel of s) {
      const el = qs(sel);
      if (el) {
        return el;
      }
    }
    return null;
  } catch (err) {
    e('Err:findSecondaryColumn', err);
    return null;
  }
}
export function isWidgetProperlyVisible(w) {
  try {
    if (!w || !document.contains(w)) {
      return false;
    }
    const s = window.getComputedStyle(w);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
      return false;
    }
    const p = w.parentElement;
    if (!p) {
      return false;
    }
    const sc = findSecondaryColumn();
    if (!sc || p !== sc || p.firstChild !== w) {
      return false;
    }
    return true;
  } catch (err) {
    e('Err:isWidgetProperlyVisible', err);
    return false;
  }
}
export function seekVideo(t) {
  try {
    const v = qs('video');
    if (v) {
      v.currentTime = t;
      v.play();
    }
  } catch (err) {
    e('Err:seekVideo', err);
  }
}
export function getVideoElement() {
  try {
    return qs('video');
  } catch (err) {
    e('Err:getVideoElement', err);
    return null;
  }
}
export function decodeHTML(h) {
  try {
    const t = ce('textarea');
    t.innerHTML = h;
    return t.value;
  } catch (err) {
    e('Err:decodeHTML', err);
    return h;
  }
}
