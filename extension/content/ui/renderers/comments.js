/**
 * Comments renderer
 */

import { state } from '../../core/state.js'
import { showLoading, showPlaceholder } from '../components/loading.js'
import { fetchCommentsFromDOM } from '../../handlers/comments.js'

/**
 * Render comments tab
 */
export async function renderComments(container) {
    // Check if already analyzed
    if (state.analysisData?.commentAnalysis) {
        container.innerHTML = `
      <div class="yt-ai-markdown">
        ${marked.parse(state.analysisData.commentAnalysis)}
      </div>
    `
        return
    }

    showLoading(container, 'Fetching comments...')

    try {
        const comments = await fetchCommentsFromDOM()

        if (!comments.length) {
            showPlaceholder(container, 'No comments found. Scroll down to load comments first.')
            return
        }

        showLoading(container, 'Analyzing comment sentiment...')

        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_COMMENTS',
            comments: comments.map(c => c.text)
        })

        if (response.success) {
            state.analysisData.commentAnalysis = response.analysis

            container.innerHTML = `
        <div class="yt-ai-markdown">
          <h3>💬 Comment Sentiment Analysis</h3>
          ${marked.parse(response.analysis)}
          <hr>
          <h4>Top Comments (${comments.length})</h4>
          ${comments.slice(0, 5).map(c => `
            <div class="yt-ai-comment">
              <div class="yt-ai-comment-author">${c.author}</div>
              <div class="yt-ai-comment-text">${c.text}</div>
              <div class="yt-ai-comment-likes">👍 ${c.likes}</div>
            </div>
          `).join('')}
        </div>
      `
        }
    } catch (error) {
        container.innerHTML = `<div class="yt-ai-error-msg">Failed: ${error.message}</div>`
    }
}
