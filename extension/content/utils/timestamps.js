import { seekVideo } from './dom.js';
import { on, fc, ap, tx, tc, dc as doc } from '../../utils/shortcuts/dom.js';
import { rt as cr, pI } from '../../utils/shortcuts/runtime.js';
import { sb as sbs, rp } from '../../utils/shortcuts/string.js';

export function makeTimestampsClickable(c) {
  const p = /(\[|[(])?(\d{1,2}):(\d{2})(\]|[)])?/g,
    w = doc.createTreeWalker(c, NodeFilter.SHOW_TEXT),
    n = [];
  let node;
  while ((node = w.nextNode())) if (p.test(tc(node))) n.push(node);
  fc(n, t => {
    const txt = tc(t),
      f = doc.createDocumentFragment();
    let l = 0;
    rp(txt, p, (m, p1, mins, secs, p4, o) => {
      if (o > l) ap(f, doc.createTextNode(sbs(txt, l, o)));
      const s = pI(mins) * 60 + pI(secs),
        lnk = cr('span');
      tc(lnk, m);
      lnk.className = 'yt-ai-clickable-timestamp';
      lnk.style.cssText =
        'color:var(--yt-ai-accent);cursor:pointer;font-weight:600;text-decoration:underline;';
      on(lnk, 'click', () => seekVideo(s));
      ap(f, lnk);
      l = o + m.length;
    });
    if (l < txt.length) ap(f, tx(sbs(txt, l)));
    t.parentNode.replaceChild(f, t);
  });
}
