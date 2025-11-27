import { showPlaceholder } from '../components/loading.js'
import { makeTimestampsClickable } from '../../utils/timestamps.js'
export function renderSummary(c, d) {
    if (!d) { showPlaceholder(c, 'Analysis not started yet.'); return }
    c.innerHTML = `<div class="yt-ai-markdown"><h3>📝 Summary</h3>${marked.parse(d.summary || 'No summary available.')}<hr><h3>💡 Key Insights</h3>${marked.parse(d.insights || 'No insights available.')}<hr><h3>❓ FAQ</h3>${marked.parse(d.faq || 'No FAQ available.')}</div>`
    makeTimestampsClickable(c)
}
