import { state } from '../core/state.js'
import { getVideoElement } from '../utils/dom.js'
let skipSegments = [], autoSkipEnabled = false
export async function setupAutoSkip(s) {
    if (!s?.length) return
    const st = state.settings
    if (!st.autoSkipSponsors && !st.autoSkipIntros) return
    skipSegments = s.filter(x => (st.autoSkipSponsors && x.label === 'Sponsor') || (st.autoSkipIntros && (x.label === 'Hook/Greetings' || x.label === 'Preview/Recap')))
    if (skipSegments.length > 0) {
        autoSkipEnabled = true
        const v = getVideoElement()
        if (v) { v.removeEventListener('timeupdate', handleAutoSkip); v.addEventListener('timeupdate', handleAutoSkip) }
    }
}
export function handleAutoSkip() {
    if (!autoSkipEnabled || !skipSegments.length) return
    const v = getVideoElement(); if (!v) return
    const t = v.currentTime
    for (const s of skipSegments) {
        if (t >= s.start && t < s.end - .5) { v.currentTime = s.end; showSkipNotification(s.label); break }
    }
}
function showSkipNotification(l) {
    const e = document.getElementById('yt-ai-skip-notif'); if (e) e.remove()
    const n = document.createElement('div')
    n.id = 'yt-ai-skip-notif'
    n.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:white;padding:12px 24px;border-radius:24px;font-size:14px;z-index:9999;animation:fadeInOut 2s ease-in-out forwards;'
    n.textContent = `⏭️ Skipped: ${l}`
    if (!document.getElementById('yt-ai-skip-styles')) {
        const s = document.createElement('style')
        s.id = 'yt-ai-skip-styles'
        s.textContent = '@keyframes fadeInOut{0%{opacity:0;transform:translateX(-50%) translateY(20px);}20%{opacity:1;transform:translateX(-50%) translateY(0);}80%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-20px);}}'
        document.head.appendChild(s)
    }
    document.body.appendChild(n)
    setTimeout(() => n.remove(), 2000)
}
