/**
 * Visual segment markers on progress bar
 */

import { getVideoElement } from '../utils/dom.js'

/**
 * Inject segment markers on YouTube progress bar
 */
export function injectSegmentMarkers(segments) {
    if (!segments?.length) return

    const progressBar = document.querySelector('.ytp-progress-bar')
    if (!progressBar) return

    // Remove existing markers
    const existing = document.getElementById('yt-ai-markers')
    if (existing) existing.remove()

    // Create container
    const container = document.createElement('div')
    container.id = 'yt-ai-markers'
    container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:30;'

    const video = getVideoElement()
    const duration = video?.duration || 0
    if (!duration) return

    // Add markers
    segments.forEach(seg => {
        if (seg.label === 'Content') return

        const start = (seg.start / duration) * 100
        const width = ((seg.end - seg.start) / duration) * 100

        const marker = document.createElement('div')
        marker.style.cssText = `
      position:absolute;
      left:${start}%;
      width:${width}%;
      height:100%;
      background:${getSegmentColor(seg.label)};
      opacity:0.6;
    `
        marker.title = seg.label
        container.appendChild(marker)
    })

    progressBar.appendChild(container)
}

function getSegmentColor(label) {
    const colors = {
        'Sponsor': '#ff4444',
        'Interaction Reminder': '#ff8800',
        'Self Promotion': '#ffaa00',
        'Unpaid Promotion': '#88cc00',
        'Highlight': '#00cc44',
        'Preview/Recap': '#00aaff',
        'Hook/Greetings': '#aa66cc',
        'Tangents/Jokes': '#cc66aa'
    }
    return colors[label] || '#999999'
}
