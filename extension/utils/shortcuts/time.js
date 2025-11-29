export const now = () => Date.now();
export const delay = (f, d) => setTimeout(f, d);
export const st = setTimeout;
export const clearDelay = i => clearTimeout(i);
export const ct = clearTimeout;
export const interval = (f, d) => setInterval(f, d);
export const si = setInterval;
export const clearInterval = i => window.clearInterval(i);
export const csi = clearInterval;
