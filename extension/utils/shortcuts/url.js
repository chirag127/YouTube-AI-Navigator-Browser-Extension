export const up = (u) => new URL(u);
export const gp = (u, k) => new URL(u).searchParams.get(k);
export const spu = (u, k, v) => {
    const x = new URL(u);
    x.searchParams.set(k, v);
    return x.toString();
};
export const apu = (u, k, v) => {
    const x = new URL(u);
    x.searchParams.append(k, v);
    return x.toString();
};
export const dpu = (u, k) => {
    const x = new URL(u);
    x.searchParams.delete(k);
    return x.toString();
};
