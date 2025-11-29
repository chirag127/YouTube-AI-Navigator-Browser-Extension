export const rt = chrome.runtime;
export const sg = (k) => chrome.storage.sync.get(k);
export const ss = (k, v) =>
    chrome.storage.sync.set(typeof k === "string" ? { [k]: v } : k);
export const lg = (k) => chrome.storage.local.get(k);
export const ls = (k, v) =>
    chrome.storage.local.set(typeof k === "string" ? { [k]: v } : k);
export const sr = (k) => chrome.storage.sync.remove(k);
export const lr = (k) => chrome.storage.local.remove(k);
export const scl = () => chrome.storage.sync.clear();
export const lcl = () => chrome.storage.local.clear();
export const url = (p) => chrome.runtime.getURL(p);
export const msg = (m, d) => chrome.runtime.sendMessage({ action: m, ...d });
export const tab = (o) => chrome.tabs.create(o);
export const tq = (q, cb) => chrome.tabs.query(q, cb);
export const tsm = (id, m, cb) => chrome.tabs.sendMessage(id, m, cb);
