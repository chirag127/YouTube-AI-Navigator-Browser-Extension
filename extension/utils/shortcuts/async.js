import { e } from "./logging.js";

export const sl = (ms) => new Promise((r) => setTimeout(r, ms));
export const sleep = sl;
export const nt = () => Date.now();
export const pnow = () => performance.now();
export const si = (fn, ms) => setInterval(fn, ms);
export const csi = (id) => clearInterval(id);
export const st = (fn, ms) => setTimeout(fn, ms);
export const cst = (id) => clearTimeout(id);
export const raf = (fn) => requestAnimationFrame(fn);
export const caf = (id) => cancelAnimationFrame(id);
export const ch = (k, ttl) => {
    const c = {};
    return {
        g: () => (c[k] && nt() - c[k].t < ttl ? c[k].v : null),
        s: (v) => (c[k] = { v, t: nt() }),
        c: () => delete c[k],
        h: () => !!c[k],
    };
};
export const tryc = async (fn, fb = null) => {
    try {
        return await fn();
    } catch (x) {
        e(x);
        return fb;
    }
};
export const trycs = (fn, fb = null) => {
    try {
        return fn();
    } catch (x) {
        e(x);
        return fb;
    }
};
export const prom = (r, v) => new Promise(r);
export const pa = (ps) => Promise.all(ps);
export const prc = (ps) => Promise.race(ps);
export const pas = (ps) => Promise.allSettled(ps);
export const pany = (ps) => Promise.any(ps);
export const prs = (v) => Promise.resolve(v);
export const prj = (e) => Promise.reject(e);
