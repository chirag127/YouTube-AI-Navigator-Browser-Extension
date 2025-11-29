import { startAnalysis } from '../core/analyzer.js';
import { state } from '../core/state.js';
import { sendChatMessage } from './chat.js';
import { l, on } from '../utils/shortcuts.js';

export function attachEventListeners(w) {
  l('[Events] Attaching listeners to widget');
  const c = w.querySelector('#yt-ai-chat-send');
  if (c)
    on(c, 'click', () => {
      l('[Events] Chat send clicked');
      sendChatMessage();
    });
  const i = w.querySelector('#yt-ai-chat-input');
  if (i)
    on(i, 'keypress', e => {
      if (e.key === 'Enter') sendChatMessage();
    });
}
