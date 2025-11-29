export const pr = Promise.resolve.bind(Promise);
export const pj = Promise.reject.bind(Promise);
export const pa = Promise.all.bind(Promise);
export const pc = Promise.race.bind(Promise);
export const pas = Promise.allSettled.bind(Promise);
export const py = Promise.any.bind(Promise);
export const np = f => new Promise(f);
export const pt = (p, t) =>
  Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error('TO')), t))]);
export const dly = t => new Promise(r => setTimeout(r, t));
export const raf = () => new Promise(r => requestAnimationFrame(r));
export const nxt = () => new Promise(r => setTimeout(r, 0));
