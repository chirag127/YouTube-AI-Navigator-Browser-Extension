const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { flr: mf } = await import(gu('utils/shortcuts/math.js'));
export function formatTime(s) {
  l('formatTime:Start');
  try {
    const h = mf(s / 3600),
      m = mf((s % 3600) / 60),
      sec = mf(s % 60);
    const result =
      h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        : `${m}:${sec.toString().padStart(2, '0')}`;
    l('formatTime:End');
    return result;
  } catch (err) {
    e('Err:formatTime', err);
    return '0:00';
  }
}
export function parseTime(t) {
  l('parseTime:Start');
  try {
    const p = t.split(':').map(Number);
    const result = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
    l('parseTime:End');
    return result;
  } catch (err) {
    e('Err:parseTime', err);
    return 0;
  }
}
