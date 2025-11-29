import { state } from '../core/state.js';
import { addChatMessage } from '../ui/renderers/chat.js';
import { parseMarkdown } from '../../lib/marked-loader.js';
import metadataExtractor from '../metadata/extractor.js';
import { ge, msg, mp, jn } from '../utils/shortcuts.js';

export async function sendChatMessage() {
  const i = ge('yt-ai-chat-input'),
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
    const md = state.currentVideoId ? await metadataExtractor.extract(state.currentVideoId) : null;
    const r = await msg({ action: 'CHAT_WITH_VIDEO', question: q, context: ctx, metadata: md });
    el.innerHTML = r.success
      ? await parseMarkdown(r.answer || 'Sorry, I could not answer that.')
      : `Error: ${r.error}`;
  } catch (x) {
    el.textContent = `Error: ${x.message}`;
  }
}
