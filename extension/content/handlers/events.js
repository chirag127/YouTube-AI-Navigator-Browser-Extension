const gu = p => chrome.runtime.getURL(p);

const { sendChatMessage } = await import(gu('content/handlers/chat.js'));
const { ae, qs } = await import(gu('utils/shortcuts/dom.js'));
const { e } = await import(gu('utils/shortcuts/log.js'));
export function attachEventListeners(w) {
  try {
    const c = qs('#yt-ai-chat-send', w);
    if (c)
      ae(c, 'click', () => {
        sendChatMessage();
      });
    const i = qs('#yt-ai-chat-input', w);
    if (i)
      ae(i, 'keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
      });
  } catch (err) {
    e('Err:attachEventListeners', err);
  }
}
