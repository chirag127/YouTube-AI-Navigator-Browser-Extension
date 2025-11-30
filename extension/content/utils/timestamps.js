const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { seekVideo } = await import(gu('content/utils/dom.js'));
const { on, fc, ap, tx, txt, dc: doc, ce, gt: tc } = await import(gu('utils/shortcuts/dom.js'));
const { pi: pI } = await import(gu('utils/shortcuts/global.js'));
const { sb: sbs, rp } = await import(gu('utils/shortcuts/string.js'));
export function makeTimestampsClickable(c) {
  try {
    const p = /(\[|[(])?(\d{1,2}):(\d{2})(\]|[)])?/g,
      w = doc.createTreeWalker(c, NodeFilter.SHOW_TEXT),
      nodes = [];
    let node;
    while ((node = w.nextNode())) if (p.test(tc(node))) nodes.push(node);
    fc(nodes, t => {
      const text = tc(t),
        f = doc.createDocumentFragment();
      let last = 0;
      rp(text, p, (m, p1, mins, secs, p4, o) => {
        if (o > last) ap(f, tx(sbs(text, last, o)));
        const s = pI(mins) * 60 + pI(secs),
          lnk = ce('span');
        txt(lnk, m);
        lnk.className = 'yt-ai-clickable-timestamp';
        lnk.style.cssText =
          'color:var(--yt-ai-accent);cursor:pointer;font-weight:600;text-decoration:underline;';
        on(lnk, 'click', () => seekVideo(s));
        ap(f, lnk);
        last = o + m.length;
      });
      if (last < text.length) ap(f, tx(sbs(text, last)));
      t.parentNode.replaceChild(f, t);
    });
  } catch (err) {
    e('Err:makeTimestampsClickable', err);
  }
}
