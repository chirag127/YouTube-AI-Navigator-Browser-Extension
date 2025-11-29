import { ce } from '../../utils/shortcuts/dom.js';
export function createTranscriptDisplay(s) {
  const c = ce('div');
  c.className = 'ytai-transcript-display';
  for (const seg of s) c.appendChild(createTranscriptLine(seg));
  return c;
}
function createTranscriptLine(s) {
  const l = ce('div');
  l.className = 'ytai-transcript-line';
  l.dataset.start = s.start;
  l.dataset.duration = s.duration;
  const ts = ce('span');
  ts.className = 'ytai-transcript-timestamp';
  ts.textContent = formatTimestamp(s.start);
  const tx = ce('span');
  tx.className = 'ytai-transcript-text';
  tx.textContent = s.text;
  l.appendChild(ts);
  l.appendChild(tx);
  return l;
}
function formatTimestamp(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
