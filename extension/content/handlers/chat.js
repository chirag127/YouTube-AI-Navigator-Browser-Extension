import { state } from '../core/state.js'
import { addChatMessage } from '../ui/renderers/chat.js'
export async function sendChatMessage() {
    const i = document.getElementById('yt-ai-chat-input'), q = i?.value?.trim()
    if (!q) return
    addChatMessage('user', q)
    i.value = ''
    const l = addChatMessage('ai', 'Thinking...')
    try {
        const ctx = state.currentTranscript.map(t => t.text).join(' ')
        const r = await chrome.runtime.sendMessage({ action: 'CHAT_WITH_VIDEO', question: q, context: ctx })
        l.innerHTML = r.success ? marked.parse(r.answer || 'Sorry, I could not answer that.') : `Error: ${r.error}`
    } catch (e) { l.textContent = `Error: ${e.message}` }
}
