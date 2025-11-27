/**
 * Transcript renderer
 */

import { showPlaceholder } from '../components/loading.js'
import { seekVideo } from '../../utils/dom.js'
import { formatTime } from '../../utils/time.js'

/**
 * Render transcript tab
 */
export function renderTranscript(container, segments) {
    if (!segments?.length) {
        showPlaceholder(container, 'No transcript available.')
        return
    }

    const html = segments.map(seg => `
    <div class="yt-ai-segment" data-time="${seg.start}">
      <span class="yt-ai-timestamp">${formatTime(seg.start)}</span>
      <span class="yt-ai-text">${seg.text}</span>
    </div>
  `).join('')

    container.innerHTML = `<div class="yt-ai-transcript-list">${html}</div>`

    // Add click handlers
    container.querySelectorAll('.yt-ai-segment').forEach(el => {
        el.addEventListener('click', () => {
            seekVideo(parseFloat(el.dataset.time))
        })
    })
}
