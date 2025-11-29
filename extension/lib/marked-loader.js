import { rp, sws } from '../utils/shortcuts/string.js';

export async function parseMarkdown(m) {
  if (!m) return '';

  let h = m;
  h = rp(h, /^### (.*$)/gim, '<h3>$1</h3>');
  h = rp(h, /^## (.*$)/gim, '<h2>$1</h2>');
  h = rp(h, /^# (.*$)/gim, '<h1>$1</h1>');
  h = rp(h, /\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = rp(h, /__(.+?)__/g, '<strong>$1</strong>');
  h = rp(h, /\*(.+?)\*/g, '<em>$1</em>');
  h = rp(h, /_(.+?)_/g, '<em>$1</em>');
  h = rp(h, /```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  h = rp(h, /`([^`]+)`/g, '<code>$1</code>');
  h = rp(
    h,
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  h = rp(
    h,
    /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g,
    '<button class="timestamp-btn" data-time="$1">$1</button>'
  );
  h = rp(h, /^\* (.+)$/gim, '<li>$1</li>');
  h = rp(h, /^- (.+)$/gim, '<li>$1</li>');
  h = rp(h, /(<li>.*<\/li>)/s, '<ul>$1</ul>');
  h = rp(h, /^\d+\. (.+)$/gim, '<li>$1</li>');
  h = rp(h, /\n\n/g, '</p><p>');
  h = rp(h, /\n/g, '<br>');
  if (!sws(h, '<')) h = `<p>${h}</p>`;
  return h;
}
export async function loadMarked() {
  return { parse: md => parseMarkdown(md) };
}
