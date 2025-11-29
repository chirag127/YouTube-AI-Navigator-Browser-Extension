import { w } from "./logging.js";

export const ft = async (u, o = {}, t = 5e3) => {
    try {
        const c = new AbortController(),
            i = setTimeout(() => c.abort(), t);
        const r = await fetch(u, { ...o, signal: c.signal });
        clearTimeout(i);
        return r.ok ? await r.json() : null;
    } catch (x) {
        w(`Fetch ${u}:`, x.message);
        return null;
    }
};
export const fj = async (u, o = {}) => {
    try {
        const r = await fetch(u, o);
        return r.ok ? await r.json() : null;
    } catch (x) {
        return null;
    }
};
export const ftx = async (u, o = {}) => {
    try {
        const r = await fetch(u, o);
        return r.ok ? await r.text() : null;
    } catch (x) {
        return null;
    }
};
export const fb = async (u, o = {}) => {
    try {
        const r = await fetch(u, o);
        return r.ok ? await r.blob() : null;
    } catch (x) {
        return null;
    }
};
export const fa = async (u, o = {}) => {
    try {
        const r = await fetch(u, o);
        return r.ok ? await r.arrayBuffer() : null;
    } catch (x) {
        return null;
    }
};
export const safeFetch = ft;
