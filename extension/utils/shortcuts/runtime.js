export const r = chrome.runtime;
export const rt = r;
export const rm = r.onMessage;
export const lis = l => r.onMessage.addListener(l);
export const rs = r.sendMessage;
export const msg = (m, c) => r.sendMessage(m, c);
export const ru = r.getURL;
export const url = p => r.getURL(p);
export const rgm = () => r.getManifest();
export const oop = () => r.openOptionsPage();
export const rrl = () => r.reload();
export const pI = parseInt;

export const getUrl = url;
export const ro = oop;
