const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { state } = await import(gu('content/core/state.js'));
const { addChatMessage } = await import(gu('content/ui/renderers/chat.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
const { qs } = await import(gu('utils/shortcuts/dom.js'));
const { rs } = await import(gu('utils/shortcuts/runtime.js'));
const { mp, jn } = await import(gu('utils/shortcuts/array.js'));
export async function sendChatMessage() {
  try {
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
      e('Err:sendChatMessage', x);
    }
  } catch (err) {
    e('Err:sendChatMessage', err);
  }
}
