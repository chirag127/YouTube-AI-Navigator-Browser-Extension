export const sg = k => chrome.storage.sync.get(k);
export const ss = (k, v) => chrome.storage.sync.set(typeof k === 'string' ? { [k]: v } : k);
export const sr = k => chrome.storage.sync.remove(k);
export const sc = () => chrome.storage.sync.clear();
export const slg = k => chrome.storage.local.get(k);
export const sls = (k, v) => chrome.storage.local.set(typeof k === 'string' ? { [k]: v } : k);
export const slr = k => chrome.storage.local.remove(k);
export const slcc = () => chrome.storage.local.clear();

export const sy = (k, v) => {
  if (v === null) return sr(k);
  if (v !== undefined) return ss(k, v);
  if (typeof k === 'object') return ss(k);
  return sg(k);
};

export const sl = (k, v) => {
  if (v === null) return slr(k);
  if (v !== undefined) return sls(k, v);
  if (typeof k === 'object') return sls(k);
  return slg(k);
};
