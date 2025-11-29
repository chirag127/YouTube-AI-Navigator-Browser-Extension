import { js } from './core.js';
export const ft = fetch;
export const fd = FormData;
export const hd = Headers;
export const rq = Request;
export const rs = Response;
export const ab = AbortController;
export const as = AbortSignal;
export const jf = async (u, o) => (await ft(u, o)).json();
export const tf = async (u, o) => (await ft(u, o)).text();
export const bf = async (u, o) => (await ft(u, o)).blob();
export const af = async (u, o) => (await ft(u, o)).arrayBuffer();
export const ff = async (u, o) => (await ft(u, o)).formData();
export const gt = (u, o) => ft(u, { ...o, method: 'GET' });
export const pt = (u, d, o) =>
    ft(u, {
        ...o,
        method: 'POST',
        body: js(d),
        headers: { 'Content-Type': 'application/json', ...o?.headers },
    });
export const pu = (u, d, o) =>
    ft(u, {
        ...o,
        method: 'PUT',
        body: js(d),
        headers: { 'Content-Type': 'application/json', ...o?.headers },
    });
export const dl = (u, o) => ft(u, { ...o, method: 'DELETE' });
export const pc = (u, d, o) =>
    ft(u, {
        ...o,
        method: 'PATCH',
        body: js(d),
        headers: { 'Content-Type': 'application/json', ...o?.headers },
    });
export const sf = async (u, o) => {
    try {
        const r = await ft(u, o);
        if (!r.ok) return null;
        return await r.json();
    } catch {
        return null;
    }
};
