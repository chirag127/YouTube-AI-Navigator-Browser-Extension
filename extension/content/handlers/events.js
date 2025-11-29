const gu = p => chrome.runtime.getURL(p);

const { sendChatMessage } = await import(gu('content/handlers/chat.js'));
const { ae, qs } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
export function attachEventListeners(w) {
  l('attachEventListeners:Start');
  try {
    l('[Ev] Attaching');
    const c = qs('#yt-ai-chat-send', w);
    if (c)
      ae(c, 'click', () => {
        l('[Ev] Send click');
        sendChatMessage();
      });
    const i = qs('#yt-ai-chat-input', w);
    if (i)
      ae(i, 'keypress', e => {
        if (e.key === 'Enter') sendChatMessage();
      });
    l('attachEventListeners:End');
  } catch (err) {
    e('Err:attachEventListeners', err);
  }
}
