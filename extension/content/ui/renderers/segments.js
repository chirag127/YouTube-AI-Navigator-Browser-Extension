import { showPlaceholder } from '../components/loading.js'
import { renderLegend, injectLegendStyles } from '../components/segment-legend.js'
import { seekVideo } from '../../utils/dom.js'
import { formatTime } from '../../utils/time.js'

const colors = {
  Sponsor: '#ff0', 'Interaction Reminder': '#0f0', 'Self Promotion': '#f80',
  'Unpaid Promotion': '#0ff', Highlight: '#f0f', 'Preview/Recap': '#88f',
  'Hook/Greetings': '#aaa', 'Tangents/Jokes': '#fa0'
}

export function renderSegments(c, s) {
  if (!s?.length) { showPlaceholder(c, 'No segments detected.'); return }
  injectLegendStyles()
  const h = s.map(x => {
    const color = colors[x.label] || '#fff'
    return `<div class="yt-ai-segment-item" data-time="${x.start}" style="border-left:4px solid ${color}"><div class="yt-ai-segment-label">${x.label}</div><div class="yt-ai-segment-time">${formatTime(x.start)} - ${formatTime(x.end)}</div><div class="yt-ai-segment-desc">${x.description || x.text || ''}</div></div>`
  }).join('')
  c.innerHTML = `${renderLegend()}<div class="yt-ai-segments-list">${h}</div>`
  c.querySelectorAll('.yt-ai-segment-item').forEach(e => e.addEventListener('click', () => seekVideo(parseFloat(e.dataset.time))))
}
