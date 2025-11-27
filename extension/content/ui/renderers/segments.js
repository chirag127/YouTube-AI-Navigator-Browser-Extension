/**
 * Segments renderer
 */

import { showPlaceholder } from '../components/loading.js'
import { seekVideo } from '../../utils/dom.js'
import { formatTime } from '../../utils/time.js'

/**
 * Render segments tab
 */
export function renderSegments(container, segments) {
    if (!segments?.length) {
        showPlaceholder(container, 'No segments detected.')
        return
    }

    const html = segments.map(seg => `
    <div class="yt-ai-segment-item ${seg.label.replace(/[^a-zA-Z]/g, '')}" data-time="${seg.start}">
      <div class="yt-ai-segment-label">${seg.label}</div>
      <div class="yt-ai-segment-time">${formatTime(seg.start)} - ${formatTime(seg.end)}</div>
      <div class="yt-ai-segment-desc">${seg.description || seg.text || ''}</div>
    </div>
  `).join('')

    container.innerHTML = `
    <div class="yt-ai-segment-legend">
      <span class="legend-item Sponsor">🔴 Sponsor</span>
      <span class="legend-item Highlight">🟢 Highlight</span>
      <span class="legend-item Content">⚪ Content</span>
    </div>
    <div class="yt-ai-segments-list">${html}</div>
  `

    // Add click handlers
    container.querySelectorAll('.yt-ai-segment-item').forEach(el => {
        el.addEventListener('click', () => {
            seekVideo(parseFloat(el.dataset.time))
        })
    })
}
