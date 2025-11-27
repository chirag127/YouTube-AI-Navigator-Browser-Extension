/**
 * Chat renderer
 */

/**
 * Render chat tab
 */
export function renderChat(container) {
    if (!container.querySelector('.yt-ai-chat-messages')) {
        container.innerHTML = `
      <div class="yt-ai-chat-messages" id="yt-ai-chat-messages">
        <div class="yt-ai-chat-msg ai">
          👋 Hi! Ask me anything about this video.
        </div>
      </div>
    `
    }
}

/**
 * Add message to chat
 */
export function addChatMessage(role, content) {
    const messagesContainer = document.getElementById('yt-ai-chat-messages')
    if (!messagesContainer) return

    const msgDiv = document.createElement('div')
    msgDiv.className = `yt-ai-chat-msg ${role}`
    msgDiv.innerHTML = role === 'ai' ? marked.parse(content) : content

    messagesContainer.appendChild(msgDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight

    return msgDiv
}
