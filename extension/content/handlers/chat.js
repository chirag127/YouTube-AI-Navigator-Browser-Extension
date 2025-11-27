/**
 * Chat handler
 */

import { state } from '../core/state.js'
import { addChatMessage } from '../ui/renderers/chat.js'

/**
 * Send chat message
 */
export async function sendChatMessage() {
    const input = document.getElementById('yt-ai-chat-input')
    const question = input?.value?.trim()

    if (!question) return

    // Add user message
    addChatMessage('user', question)
    input.value = ''

    // Add loading message
    const loadingMsg = addChatMessage('ai', 'Thinking...')

    try {
        const context = state.currentTranscript.map(t => t.text).join(' ')

        const response = await chrome.runtime.sendMessage({
            action: 'CHAT_WITH_VIDEO',
            question,
            context
        })

        if (response.success) {
            loadingMsg.innerHTML = marked.parse(response.answer || 'Sorry, I could not answer that.')
        } else {
            loadingMsg.textContent = `Error: ${response.error}`
        }
    } catch (error) {
        loadingMsg.textContent = `Error: ${error.message}`
    }
}
