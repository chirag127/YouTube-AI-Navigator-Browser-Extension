const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
const { ce, qs: $ } = await import(gu('utils/shortcuts/dom.js'));
export function renderChat(c) {
  try {
    if (!$('.yt-ai-chat-messages', c)) {
      c.innerHTML = `<div class="yt-ai-chat-messages" id="yt-ai-chat-messages"><div class="yt-ai-chat-msg ai">👋 Hi! Ask me anything about this video.</div></div>`;
    }
  } catch (err) {
    e('Err:renderChat', err);
  }
}
export async function addChatMessage(r, t) {
  try {
    const m = $('#yt-ai-chat-messages');
    if (!m) return;
    const d = ce('div');
    d.className = `yt-ai-chat-msg ${r}`;
    d.innerHTML = r === 'ai' ? await parseMarkdown(t) : t;
    m.appendChild(d);
    m.scrollTop = m.scrollHeight;
    return d;
  } catch (err) {
    e('Err:addChatMessage', err);
    return null;
  }
}
