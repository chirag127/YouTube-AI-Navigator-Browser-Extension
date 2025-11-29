import { l, e } from '../../utils/shortcuts/logging.js';

export function fillContentGaps(c, o) {
  l('ENTRY:fillContentGaps');
  if (!o || !o.length) {
    l('[Gaps] No transcript provided to fillContentGaps');
    l('EXIT:fillContentGaps');
    return [];
  }
  try {
    const last = o[o.length - 1];
    if (!last || typeof last.start === 'undefined') {
      l('[Gaps] Invalid transcript format');
      l('EXIT:fillContentGaps');
      return [];
    }
    const end = last.start + (last.duration || 0),
      s = (c || []).sort((a, b) => a.start - b.start),
      f = [];
    let t = 0;
    for (const seg of s) {
      if (seg.start > t + 1)
        f.push({ label: 'Content', start: t, end: seg.start, text: 'Main Content' });
      f.push({ ...seg, text: seg.description || seg.label });
      t = Math.max(t, seg.end);
    }
    if (t < end - 1) f.push({ label: 'Content', start: t, end, text: 'Main Content' });
    l('EXIT:fillContentGaps');
    return f;
  } catch (x) {
    e('error:fillContentGaps', x);
    l('EXIT:fillContentGaps');
    return [];
  }
}
