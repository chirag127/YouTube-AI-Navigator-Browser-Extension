const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
const { parseMarkdown } = await import(gu('lib/marked-loader.js'));
const { ce, qs: $ } = await import(gu('utils/shortcuts/dom.js'));
function parseTime(t) {
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  if (p.length === 2) return p[0] * 60 + p[1];
  return 0;
}

export function renderChat(c) {
  try {
    if (!$('.yt-ai-chat-messages', c)) {
      c.innerHTML = `<div class="yt-ai-chat-messages" id="yt-ai-chat-messages"><div class="yt-ai-chat-msg ai">👋 Hi! Ask me anything about this video.</div></div>`;
      const mc = $('.yt-ai-chat-messages', c);
      mc.addEventListener('click', e => {
        if (e.target.classList.contains('timestamp-btn')) {
          const t = e.target.dataset.time;
          const s = parseTime(t);
          const v = $('video');
          if (v) v.currentTime = s;
        }
      });
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
