import { l, e, $, st } from '../utils/shortcuts.js';

export function log(m, d) {
  const t = new Date().toISOString().split('T')[1].slice(0, -1);
  l(`[YTAI ${t}] ${m}`, d || '');
}

export function logError(c, r) {
  e(`[YTAI ERROR] ${c}:`, r);
}

export function checkElement(s) {
  const x = !!$(s);
  log(`Element check: ${s}`, x ? '✓' : '✗');
  return x;
}

export function waitForElement(s, t = 10000) {
  return new Promise((r, j) => {
    const el = $(s);
    if (el) return r(el);
    const o = new MutationObserver(() => {
      const el = $(s);
      if (el) {
        o.disconnect();
        r(el);
      }
    });
    o.observe(document.body, { childList: true, subtree: true });
    st(() => {
      o.disconnect();
      j(new Error(`Timeout waiting for ${s}`));
    }, t);
  });
}
