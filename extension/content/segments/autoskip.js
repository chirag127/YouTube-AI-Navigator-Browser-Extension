const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { getVideoElement } = await import(gu('content/utils/dom.js'));
const { sg } = await import(gu('utils/shortcuts/storage.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
const { qs, ae, re, ce } = await import(gu('utils/shortcuts/dom.js'));
let as = [];
let en = false;
let opr = 1;
let isu = false;
export async function setupAutoSkip(s) {
  try {
    if (!s?.length) {
      e('[AutoSkip] No segments provided');
      return;
    }
    const st = await sg('config');
    const cfg = st.config || {};
    const me = cfg.segments?.enabled === true;
    const ase = cfg.segments?.autoSkip === true;
    if (!me || !ase) {
      disableAutoSkip();
      e(`[AutoSkip] Disabled (enabled:${me}, autoSkip:${ase})`);
      return;
    }
    const cats = cfg.segments?.categories || {};
    const tol = cfg.segments?.skipTolerance || 0.5;
    const msd = cfg.segments?.minSegmentDuration || 1;
    as = s
      .filter(x => {
        if (x.label === 'Content' || x.label === 'Main Content') return false;
        const lk = getLabelKey(x.label);
        const c = cats[lk] || { action: 'ignore', speed: 2 };
        const dur = x.end - x.start;
        return c.action && c.action !== 'ignore' && dur >= msd;
      })
      .map(x => {
        const lk = getLabelKey(x.label);
        return { ...x, config: cats[lk] || { action: 'ignore', speed: 2 }, tolerance: tol };
      });
    if (as.length > 0) {
      en = true;
      const v = getVideoElement();
      if (v) {
        re(v, 'timeupdate', handleAutoSkip);
        ae(v, 'timeupdate', handleAutoSkip);
        opr = v.playbackRate;
        e(`[AutoSkip] Enabled with ${as.length}/${s.length} segments`);
      } else {
        e('[AutoSkip] Video element not found, retrying...');
        to(() => setupAutoSkip(s), 1000);
      }
    } else {
      disableAutoSkip();
      e('[AutoSkip] No actionable segments (all ignored)');
    }
  } catch (err) {
    e('Err:setupAutoSkip', err);
  }
}
function getLabelKey(l) {
  const m = {
    Sponsor: 'sponsor',
    'Self Promotion': 'selfpromo',
    'Unpaid/Self Promotion': 'selfpromo',
    'Interaction Reminder': 'interaction',
    'Intermission/Intro Animation': 'intro',
    'Intermission/Intro': 'intro',
    'Endcards/Credits': 'outro',
    'Preview/Recap': 'preview',
    'Tangents/Jokes': 'filler',
    'Filler/Tangent': 'filler',
    Highlight: 'poi_highlight',
    'Exclusive Access': 'exclusive_access',
    'Off-Topic': 'music_offtopic',
  };
  return m[l] || l.toLowerCase().replace(/\s+/g, '_');
}
function disableAutoSkip() {
  try {
    en = false;
    const v = getVideoElement();
    if (v) {
      re(v, 'timeupdate', handleAutoSkip);
      if (isu) {
        v.playbackRate = opr;
        isu = false;
      }
    }
  } catch (err) {
    e('Err:disableAutoSkip', err);
  }
}
export function handleAutoSkip() {
  try {
    if (!en || !as.length) return;
    const v = getVideoElement();
    if (!v) return;
    const t = v.currentTime;
    let ins = false;
    for (const s of as) {
      if (s.label === 'Content' || s.label === 'Main Content') continue;
      const tol = s.tolerance || 0.5;
      if (t >= s.start - tol && t < s.end + tol) {
        if (s.config.action === 'skip') {
          const nt = s.end + 0.1;
          if (Math.abs(v.currentTime - nt) > 0.5) {
            v.currentTime = nt;
            showNotification(`⏭️ Skipped: ${s.label}`);
            e(`[AutoSkip] Skipped ${s.label} (${s.start.toFixed(1)}s-${s.end.toFixed(1)}s)`);
          }
          return;
        } else if (s.config.action === 'speed') {
          ins = true;
          if (!isu) {
            opr = v.playbackRate;
            v.playbackRate = s.config.speed || 2;
            isu = true;
            showNotification(`⏩ Speeding: ${s.label} (${s.config.speed}x)`);
            e(`[AutoSkip] Speed ${s.label} at ${s.config.speed}x`);
          }
          if (v.playbackRate !== s.config.speed) v.playbackRate = s.config.speed;
        }
      }
    }
    if (isu && !ins) {
      v.playbackRate = opr;
      isu = false;
      e('[AutoSkip] Restored normal speed');
    }
  } catch (err) {
    e('Err:handleAutoSkip', err);
  }
}
function showNotification(tx) {
  try {
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
  } catch (err) {
    e('Err:showNotification', err);
  }
}
