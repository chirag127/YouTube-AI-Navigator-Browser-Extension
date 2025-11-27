export function findSecondaryColumn() {
    const s = ['#secondary', '#secondary-inner', '#related', 'ytd-watch-next-secondary-results-renderer']
    for (const x of s) { const e = document.querySelector(x); if (e && e.offsetParent !== null) return e }
    return null
}
export function seekVideo(t) { const v = document.querySelector('video'); if (v) { v.currentTime = t; v.play() } }
export function getVideoElement() { return document.querySelector('video') }
export function decodeHTML(h) { const t = document.createElement('textarea'); t.innerHTML = h; return t.value }
