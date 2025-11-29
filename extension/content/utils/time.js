import { fl as mf } from '../../utils/shortcuts/math.js';

export function formatTime(s) {
  const h = mf(s / 3600),
    m = mf((s % 3600) / 60),
    sec = mf(s % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}
export function parseTime(t) {
  const p = t.split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}
