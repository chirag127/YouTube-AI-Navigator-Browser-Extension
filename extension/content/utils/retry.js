import { st } from '../../utils/shortcuts/time.js';

export async function retry(fn, max = 3, d = 1000) {
  for (let i = 1; i <= max; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === max) throw e;
      await sleep(d * i);
    }
  }
}
export function sleep(ms) {
  return new Promise(r => st(r, ms));
}
