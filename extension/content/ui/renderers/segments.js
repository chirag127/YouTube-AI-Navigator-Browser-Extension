import { showPlaceholder } from '../components/loading.js'
import { seekVideo } from '../../utils/dom.js'
import { formatTime } from '../../utils/time.js'
export function renderSegments(c, s) {
  if (!s?.length) { showPlaceholder(c, 'No segments detected.'); return }
  const h = s.map(x => `<div class="yt-ai-segment-item ${x.label.replace(/[^a-zA-Z]/g, '')}" data-time="${x.start}"><div class="yt-ai-segment-label">${x.label}</div><div class="yt-ai-segment-time">${formatTime(x.start)} - ${formatTime(x.end)}</div><div class="yt-ai-segment-desc">${x.description || x.text || ''}</div></div>`).join('')
  c.innerHTML = `<div class="yt-ai-segment-legend"><span class="legend-item Sponsor">🔴 Sponsor</span><span class="legend-item Highlight">🟢 Highlight</span><span class="legend-item Content">⚪ Content</span></div><div class="yt-ai-segments-list">${h}</div>`
  c.querySelectorAll('.yt-ai-segment-item').forEach(e => e.addEventListener('click', () => seekVideo(parseFloat(e.dataset.time))))
}
