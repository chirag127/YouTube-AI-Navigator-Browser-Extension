export const cw = chrome.windows;
export const wg = (i, c) => chrome.windows.get(i, c);
export const wc = (d, c) => chrome.windows.create(d, c);
export const wr = (i, c) => chrome.windows.remove(i, c);
export const wu = (i, u, c) => chrome.windows.update(i, u, c);
