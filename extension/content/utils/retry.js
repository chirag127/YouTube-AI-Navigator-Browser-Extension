const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
export async function retry(fn, max = 3, d = 1000) {
  try {
    for (let i = 1; i <= max; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === max) throw err;
        await sleep(d * i);
      }
    }
  } catch (err) {
    e('Err:retry', err);
    throw err;
  }
}
export function sleep(ms) {
  try {
    return new Promise(r => to(r, ms));
  } catch (err) {
    e('Err:sleep', err);
    return Promise.resolve();
  }
}
