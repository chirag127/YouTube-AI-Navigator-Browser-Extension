// Core utility functions

// Date/Time
export const now = () => Date.now();
export const nw = now;

// JSON
export const jp = (str) => JSON.parse(str);
export const js = (obj, replacer = null, space = 0) => JSON.stringify(obj, replacer, space);

// Object utilities
export const keys = (obj) => Object.keys(obj);
export const ok = keys;
export const values = (obj) => Object.values(obj);
export const vl = values;
export const entries = (obj) => Object.entries(obj);
export const oe = entries;

// String utilities
export const isS = (val) => typeof val === 'string';
export const sw = (str, prefix) => str.startsWith(prefix);

// Array utilities
export const mp = (arr, fn) => arr.map(fn);

// Timeout
export const to = (fn, delay) => setTimeout(fn, delay);
export const stt = to;
