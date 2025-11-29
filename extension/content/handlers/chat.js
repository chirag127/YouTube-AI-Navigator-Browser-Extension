import { state } from '../core/state.js';
import { addChatMessage } from '../ui/renderers/chat.js';
import { parseMarkdown } from '../../lib/marked-loader.js';
import { qs } from '../../utils/shortcuts/dom.js';
import { rs } from '../../utils/shortcuts/runtime.js';
import { mp, jn } from '../../utils/shortcuts/array.js';
export async function sendChatMessage() {
  const i = qs('#yt-ai-chat-input'),
    q = i?.value?.trim();
  if (!q) return;
  await addChatMessage('user', q);
  i.value = '';
  const el = await addChatMessage('ai', 'Thinking...');
  try {
    const ctx = jn(
      mp(state.currentTranscript, t => t.text),
      ' '
    );
    const md = null;
    const r = await rs({ action: 'CHAT_WITH_VIDEO', question: q, context: ctx, metadata: md });
    el.innerHTML = r.success
      ? await parseMarkdown(r.answer || 'Sorry, I could not answer that.')
      : `Error: ${r.error}`;
  } catch (x) {
    el.textContent = `Error: ${x.message}`;
  }
}
