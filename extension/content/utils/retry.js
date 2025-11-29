const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { to } = await import(gu('utils/shortcuts/global.js'));
export async function retry(fn, max = 3, d = 1000) {
  l('retry:Start');
  try {
    for (let i = 1; i <= max; i++) {
      try {
        const result = await fn();
        l('retry:End');
        return result;
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
  l('sleep:Start');
  try {
    const result = new Promise(r => to(r, ms));
    l('sleep:End');
    return result;
  } catch (err) {
    e('Err:sleep', err);
    return Promise.resolve();
  }
}
