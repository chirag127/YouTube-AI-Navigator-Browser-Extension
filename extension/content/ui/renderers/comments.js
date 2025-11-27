import { state } from '../../core/state.js'
import { showLoading, showPlaceholder } from '../components/loading.js'
import { fetchCommentsFromDOM } from '../../handlers/comments.js'
export async function renderComments(c) {
  if (state.analysisData?.commentAnalysis) {
    c.innerHTML = `<div class="yt-ai-markdown">${marked.parse(state.analysisData.commentAnalysis)}</div>`
    return
  }
  showLoading(c, 'Fetching comments...')
  try {
    const cm = await fetchCommentsFromDOM()
    if (!cm.length) { showPlaceholder(c, 'No comments found. Scroll down to load comments first.'); return }
    showLoading(c, 'Analyzing comment sentiment...')
    const r = await chrome.runtime.sendMessage({ action: 'ANALYZE_COMMENTS', comments: cm.map(x => x.text) })
    if (r.success) {
      state.analysisData.commentAnalysis = r.analysis
      c.innerHTML = `<div class="yt-ai-markdown"><h3>💬 Comment Sentiment Analysis</h3>${marked.parse(r.analysis)}<hr><h4>Top Comments (${cm.length})</h4>${cm.slice(0, 5).map(x => `<div class="yt-ai-comment"><div class="yt-ai-comment-author">${x.author}</div><div class="yt-ai-comment-text">${x.text}</div><div class="yt-ai-comment-likes">👍 ${x.likes}</div></div>`).join('')}</div>`
    }
  } catch (e) { c.innerHTML = `<div class="yt-ai-error-msg">Failed: ${e.message}</div>` }
}
