import { getVideoElement } from '../utils/dom.js';
import { sg } from '../../utils/shortcuts/storage.js';

import { qs, ae, re, ce } from '../../utils/shortcuts/dom.js';
let as = [];
let en = false;
let opr = 1;
let isu = false;
export async function setupAutoSkip(s) {
  if (!s?.length) return;
  const st = await sg(null);
  const set = st.segments || {};
  const me = st.enableSegments !== false;
  if (!me) {
    disableAutoSkip();
    return;
  }
  as = s
    .filter(x => {
      const c = set[x.label];
      return c && c.action && c.action !== 'ignore';
    })
    .map(x => ({ ...x, config: set[x.label] }));
  if (as.length > 0) {
    en = true;
    const v = getVideoElement();
    if (v) {
      re(v, 'timeupdate', handleAutoSkip);
      ae(v, 'timeupdate', handleAutoSkip);
      opr = v.playbackRate;
    }
  } else disableAutoSkip();
}
function disableAutoSkip() {
  en = false;
  const v = getVideoElement();
  if (v) {
    re(v, 'timeupdate', handleAutoSkip);
    if (isu) {
      v.playbackRate = opr;
      isu = false;
    }
  }
}
export function handleAutoSkip() {
  if (!en || !as.length) return;
  const v = getVideoElement();
  if (!v) return;
  const t = v.currentTime;
  let ins = false;
  for (const s of as) {
    if (t >= s.start && t < s.end) {
      if (s.config.action === 'skip') {
        v.currentTime = s.end + 0.1;
        showNotification(`⏭️ Skipped: ${s.label}`);
        return;
      } else if (s.config.action === 'speed') {
        ins = true;
        if (!isu) {
          opr = v.playbackRate;
          v.playbackRate = s.config.speed || 2;
          isu = true;
          showNotification(`⏩ Speeding up: ${s.label} (${s.config.speed}x)`);
        }
        if (v.playbackRate !== s.config.speed) v.playbackRate = s.config.speed;
      }
    }
  }
  if (isu && !ins) {
    v.playbackRate = opr;
    isu = false;
  }
}
function showNotification(tx) {
  const id = 'yt-ai-skip-notif';
  let n = qs('#' + id);
  if (n) n.remove();
  n = ce('div');
  n.id = id;
  n.style.cssText =
    'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;pointer-events:none;font-family:sans-serif;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);';
  n.textContent = tx;
  n.animate(
    [
      { opacity: 0, transform: 'translate(-50%, 20px)' },
      { opacity: 1, transform: 'translate(-50%, 0)' },
      { opacity: 1, offset: 0.8 },
      { opacity: 0, transform: 'translate(-50%, -20px)' },
    ],
    { duration: 2000, easing: 'ease-out', fill: 'forwards' }
  );
  document.body.appendChild(n);
  to(() => {
    if (n.parentNode) n.remove();
  }, 2000);
}
