// Async utility functions

// Promise utilities
export const np = () => new Promise((resolve) => resolve());
export const pc = (promises) => Promise.all(promises);
export const pa = pc;
export const ps = (promises) => Promise.allSettled(promises);

// requestAnimationFrame
export const raf = (callback) => requestAnimationFrame(callback);
