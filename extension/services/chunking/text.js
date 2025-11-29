import { trm as tr, sb as sub, li as lio } from '../../utils/shortcuts/string.js';
import { l } from '../../utils/shortcuts/logging.js';

export function chunkText(t, s = 20000, o = 500) {
  l('ENTRY:chunkText');
  if (!t) {
    l('EXIT:chunkText');
    return [];
  }
  if (t.length <= s) {
    l('EXIT:chunkText');
    return [t];
  }
  const c = [];
  let i = 0;
  while (i < t.length) {
    let e = i + s;
    if (e < t.length) {
      const sp = lio(t, ' ', e),
        p = lio(t, '.', e);
      if (p > i + s * 0.5) e = p + 1;
      else if (sp > i) e = sp + 1;
    }
    const ch = tr(sub(t, i, e));
    if (ch) c.push(ch);
    i = e - o;
    if (i >= e) i = e;
  }
  l('EXIT:chunkText');
  return c;
}
