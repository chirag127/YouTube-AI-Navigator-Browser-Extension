export const U = URL;
export const UP = URLSearchParams;
export const uo = u => new URL(u);
export const up = s => new URLSearchParams(s);
export const uv = u => URL.revokeObjectURL(u);
export const ub = o => URL.createObjectURL(o);
