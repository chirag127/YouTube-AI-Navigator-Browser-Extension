/**
 * Tab management
 */

import { state } from '../core/state.js'
import { renderSummary } from './renderers/summary.js'
import { renderTranscript } from './renderers/transcript.js'
import { renderSegments } from './renderers/segments.js'
import { renderChat } from './renderers/chat.js'
import { renderComments } from './renderers/comments.js'

/**
 * Initialize tab switching
 */
export function initTabs(container) {
    const tabs = container.querySelectorAll('.yt-ai-tab')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab))
    })
}

/**
 * Switch to a specific tab
 */
export function switchTab(tabName) {
    const container = document.getElementById('yt-ai-master-widget')
    if (!container) return

    // Update active tab
    container.querySelectorAll('.yt-ai-tab').forEach(t => t.classList.remove('active'))
    container.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active')

    // Show/hide chat input
    const chatInput = document.getElementById('yt-ai-chat-input-area')
    if (chatInput) {
        chatInput.style.display = tabName === 'chat' ? 'flex' : 'none'
    }

    // Render content
    const contentArea = document.getElementById('yt-ai-content-area')
    if (!contentArea) return

    switch (tabName) {
        case 'summary':
            renderSummary(contentArea, state.analysisData)
            break
        case 'transcript':
            renderTranscript(contentArea, state.currentTranscript)
            break
        case 'segments':
            renderSegments(contentArea, state.analysisData?.segments)
            break
        case 'chat':
            renderChat(contentArea)
            break
        case 'comments':
            renderComments(contentArea)
            break
    }
}
