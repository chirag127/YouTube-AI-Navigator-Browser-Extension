import { showPlaceholder } from '../components/loading.js'
import { seekVideo } from '../../utils/dom.js'
import { formatTime } from '../../utils/time.js'
export function renderTranscript(c, s) {
  if (!s?.length) { showPlaceholder(c, 'No transcript available.'); return }
  const h = s.map(x => `<div class="yt-ai-segment" data-time="${x.start}"><span class="yt-ai-timestamp">${formatTime(x.start)}</span><span class="yt-ai-text">${x.text}</span></div>`).join('')
  c.innerHTML = `<div class="yt-ai-transcript-list">${h}</div>`
  c.querySelectorAll('.yt-ai-segment').forEach(e => e.addEventListener('click', () => seekVideo(parseFloat(e.dataset.time))))
}
