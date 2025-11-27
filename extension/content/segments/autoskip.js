/**
 * Auto-skip functionality
 */

import { state } from '../core/state.js'
import { getVideoElement } from '../utils/dom.js'

let skipSegments = []
let autoSkipEnabled = false

/**
 * Setup auto-skip for segments
 */
export async function setupAutoSkip(segments) {
    if (!segments?.length) return

    const settings = state.settings
    if (!settings.autoSkipSponsors && !settings.autoSkipIntros) return

    // Filter segments to skip
    skipSegments = segments.filter(seg => {
        if (settings.autoSkipSponsors && seg.label === 'Sponsor') return true
        if (settings.autoSkipIntros && (seg.label === 'Hook/Greetings' || seg.label === 'Preview/Recap')) return true
        return false
    })

    if (skipSegments.length > 0) {
        autoSkipEnabled = true
        const video = getVideoElement()
        if (video) {
            video.removeEventListener('timeupdate', handleAutoSkip)
            video.addEventListener('timeupdate', handleAutoSkip)
        }
    }
}

/**
 * Handle auto-skip on timeupdate
 */
export function handleAutoSkip() {
    if (!autoSkipEnabled || !skipSegments.length) return

    const video = getVideoElement()
    if (!video) return

    const currentTime = video.currentTime

    for (const seg of skipSegments) {
        if (currentTime >= seg.start && currentTime < seg.end - 0.5) {
            console.log('Auto-skipping:', seg.label)
            video.currentTime = seg.end
            showSkipNotification(seg.label)
            break
        }
    }
}

function showSkipNotification(label) {
    const existing = document.getElementById('yt-ai-skip-notif')
    if (existing) existing.remove()

    const notif = document.createElement('div')
    notif.id = 'yt-ai-skip-notif'
    notif.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:rgba(0,0,0,0.9);color:white;padding:12px 24px;
    border-radius:24px;font-size:14px;z-index:9999;
    animation:fadeInOut 2s ease-in-out forwards;
  `
    notif.textContent = `⏭️ Skipped: ${label}`

    if (!document.getElementById('yt-ai-skip-styles')) {
        const style = document.createElement('style')
        style.id = 'yt-ai-skip-styles'
        style.textContent = `
      @keyframes fadeInOut {
        0% { opacity:0; transform:translateX(-50%) translateY(20px); }
        20% { opacity:1; transform:translateX(-50%) translateY(0); }
        80% { opacity:1; transform:translateX(-50%) translateY(0); }
        100% { opacity:0; transform:translateX(-50%) translateY(-20px); }
      }
    `
        document.head.appendChild(style)
    }

    document.body.appendChild(notif)
    setTimeout(() => notif.remove(), 2000)
}
