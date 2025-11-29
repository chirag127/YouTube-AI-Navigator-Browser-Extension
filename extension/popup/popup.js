import { qs as i, rc } from '../utils/shortcuts/dom.js';
import { slg as sl, sg } from '../utils/shortcuts/storage.js';
import { w } from '../utils/shortcuts/log.js';
import { to as to } from '../utils/shortcuts/global.js';
import { tq, tm, tc } from '../utils/shortcuts/tabs.js';
import { ru as url, ro as oop } from '../utils/shortcuts/runtime.js';
const a = i('#api-status'),
  p = i('#page-status'),
  b = i('#analyze-btn'),
  h = i('#history-btn'),
  o = i('#options-btn'),
  m = i('#message'),
  g = i('#setup-guide-btn');
function showMsg(t, y = 'info') {
  m.textContent = t;
  m.className = `show ${y}`;
  to(() => rc(m, 'show'), 3000);
}
async function checkApi() {
  try {
    const s = await sg(['apiKey', 'onboardingCompleted']),
      lc = await sl('geminiApiKey'),
      k = s.apiKey || lc.geminiApiKey;
    if (k) {
      a.innerHTML = '<span>✅ Configured</span>';
      a.className = 'value success';
      g.style.display = 'none';
      return true;
    }
    a.innerHTML = '<span>⚠️ Not configured</span>';
    a.className = 'value warning';
    g.style.display = 'block';
    return false;
  } catch (x) {
    w('API check failed:', x);
    return false;
  }
}
async function checkPage() {
  try {
    const [t] = await tq({ active: true, currentWindow: true });
    if (t && t.url && t.url.includes('youtube.com/watch')) {
      p.innerHTML = '<span>✅ YouTube Video</span>';
      p.className = 'value success';
      b.disabled = false;
      return true;
    }
    p.innerHTML = '<span>⚠️ Not on YouTube</span>';
    p.className = 'value warning';
    b.disabled = true;
    return false;
  } catch (x) {
    w('Page check failed:', x);
    return false;
  }
}
b.onclick = async () => {
  try {
    const [t] = await tq({ active: true, currentWindow: true });
    if (!t) return;
    await tm(t.id, { action: 'ANALYZE_VIDEO' });
    showMsg('Analysis started!', 'success');
  } catch (x) {
    showMsg('Failed to start analysis', 'error');
  }
};
h.onclick = () => tc({ url: url('history/history.html') });
o.onclick = () => oop();
g.onclick = () => oop();
(async () => {
  await checkApi();
  await checkPage();
})();
