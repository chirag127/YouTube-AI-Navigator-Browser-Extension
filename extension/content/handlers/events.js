import { sendChatMessage } from './chat.js';
import { ae, qs } from '../../utils/shortcuts/dom.js';
import { l } from '../../utils/shortcuts/log.js';
export function attachEventListeners(w) {
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
}
