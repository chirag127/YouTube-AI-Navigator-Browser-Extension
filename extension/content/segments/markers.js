import { getVideoElement } from '../utils/dom.js'
export function injectSegmentMarkers(s) {
    if (!s?.length) return
    const p = document.querySelector('.ytp-progress-bar'); if (!p) return
    const e = document.getElementById('yt-ai-markers'); if (e) e.remove()
    const c = document.createElement('div')
    c.id = 'yt-ai-markers'
    c.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:30;'
    const v = getVideoElement(), d = v?.duration || 0; if (!d) return
    s.forEach(x => {
        if (x.label === 'Content') return
        const st = (x.start / d) * 100, w = ((x.end - x.start) / d) * 100, m = document.createElement('div')
        m.style.cssText = `position:absolute;left:${st}%;width:${w}%;height:100%;background:${getSegmentColor(x.label)};opacity:0.6;`
        m.title = x.label
        c.appendChild(m)
    })
    p.appendChild(c)
}
function getSegmentColor(l) {
    const c = { 'Sponsor': '#ff4444', 'Interaction Reminder': '#ff8800', 'Self Promotion': '#ffaa00', 'Unpaid Promotion': '#88cc00', 'Highlight': '#00cc44', 'Preview/Recap': '#00aaff', 'Hook/Greetings': '#aa66cc', 'Tangents/Jokes': '#cc66aa' }
    return c[l] || '#999999'
}
