import { l } from '../../utils/shortcuts/logging.js';
export function chunkSegments(s, sz = 20000) {
  l('ENTRY:chunkSegments');
  if (!s || !s.length) {
    l('EXIT:chunkSegments');
    return [];
  }
  const c = [];
  let cur = { text: '', start: s[0].start, end: s[0].start + s[0].duration };
  for (const seg of s) {
    if (cur.text.length + seg.text.length > sz && cur.text.length > 0) {
      c.push(cur);
      cur = { text: '', start: seg.start, end: seg.start + seg.duration };
    }
    cur.text += (cur.text ? ' ' : '') + seg.text;
    cur.end = seg.start + seg.duration;
  }
  if (cur.text.length > 0) c.push(cur);
  l('EXIT:chunkSegments');
  return c;
}
