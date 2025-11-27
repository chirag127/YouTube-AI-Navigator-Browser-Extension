export function renderChat(c) {
  if (!c.querySelector('.yt-ai-chat-messages')) {
    c.innerHTML = `<div class="yt-ai-chat-messages" id="yt-ai-chat-messages"><div class="yt-ai-chat-msg ai">👋 Hi! Ask me anything about this video.</div></div>`
  }
}
export function addChatMessage(r, t) {
  const m = document.getElementById('yt-ai-chat-messages')
  if (!m) return
  const d = document.createElement('div')
  d.className = `yt-ai-chat-msg ${r}`
  d.innerHTML = r === 'ai' ? marked.parse(t) : t
  m.appendChild(d)
  m.scrollTop = m.scrollHeight
  return d
}
