/**
 * Summary renderer
 */

import { showPlaceholder } from '../components/loading.js'
import { makeTimestampsClickable } from '../../utils/timestamps.js'

/**
 * Render summary tab
 */
export function renderSummary(container, data) {
    if (!data) {
        showPlaceholder(container, 'Analysis not started yet.')
        return
    }

    container.innerHTML = `
    <div class="yt-ai-markdown">
      <h3>📝 Summary</h3>
      ${marked.parse(data.summary || 'No summary available.')}
      <hr>
      <h3>💡 Key Insights</h3>
      ${marked.parse(data.insights || 'No insights available.')}
      <hr>
      <h3>❓ FAQ</h3>
      ${marked.parse(data.faq || 'No FAQ available.')}
    </div>
  `

    makeTimestampsClickable(container)
}
