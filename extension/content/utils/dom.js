const gu = p => chrome.runtime.getURL(p);
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { ce, qs } = await import(gu('utils/shortcuts/dom.js'));
export function findSecondaryColumn() {
  l('findSecondaryColumn:Start');
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
        l('findSecondaryColumn:End');
        return el;
      }
    }
    for (const sel of s) {
      const el = qs(sel);
      if (el) {
        l('findSecondaryColumn:End');
        return el;
      }
    }
    l('findSecondaryColumn:End');
    return null;
  } catch (err) {
    e('Err:findSecondaryColumn', err);
    return null;
  }
}
export function isWidgetProperlyVisible(w) {
  l('isWidgetProperlyVisible:Start');
  try {
    if (!w || !document.contains(w)) {
      l('isWidgetProperlyVisible:End');
      return false;
    }
    const s = window.getComputedStyle(w);
    if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') {
      l('isWidgetProperlyVisible:End');
      return false;
    }
    const p = w.parentElement;
    if (!p) {
      l('isWidgetProperlyVisible:End');
      return false;
    }
    const sc = findSecondaryColumn();
    if (!sc || p !== sc || p.firstChild !== w) {
      l('isWidgetProperlyVisible:End');
      return false;
    }
    l('isWidgetProperlyVisible:End');
    return true;
  } catch (err) {
    e('Err:isWidgetProperlyVisible', err);
    return false;
  }
}
export function seekVideo(t) {
  l('seekVideo:Start');
  try {
    const v = qs('video');
    if (v) {
      v.currentTime = t;
      v.play();
    }
    l('seekVideo:End');
  } catch (err) {
    e('Err:seekVideo', err);
  }
}
export function getVideoElement() {
  l('getVideoElement:Start');
  try {
    const result = qs('video');
    l('getVideoElement:End');
    return result;
  } catch (err) {
    e('Err:getVideoElement', err);
    return null;
  }
}
export function decodeHTML(h) {
  l('decodeHTML:Start');
  try {
    const t = ce('textarea');
    t.innerHTML = h;
    const result = t.value;
    l('decodeHTML:End');
    return result;
  } catch (err) {
    e('Err:decodeHTML', err);
    return h;
  }
}
