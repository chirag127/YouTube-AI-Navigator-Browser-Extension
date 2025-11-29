import { sendChatMessage } from './chat.js';
import { on } from '../../utils/shortcuts/dom.js';
import { l } from '../../utils/shortcuts/log.js';
import { qs } from '../../utils/shortcuts/dom.js';

export function attachEventListeners(w) {
  l('[Events] Attaching listeners to widget');
  const c = qs('#yt-ai-chat-send', w);
  if (c)
    on(c, 'click', () => {
      l('[Events] Chat send clicked');
      sendChatMessage();
    });
  const i = qs('#yt-ai-chat-input', w);
  if (i)
    on(i, 'keypress', e => {
      if (e.key === 'Enter') sendChatMessage();
    });
}
