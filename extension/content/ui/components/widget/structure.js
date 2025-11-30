export function createWidgetHTML(cfg = {}) {
  const tabs = cfg.tabs || { summary: true, segments: true, chat: true, comments: true };
  let tabsHTML = '';
  if (tabs.summary) tabsHTML += '<div class="yt-ai-tab active" data-tab="summary">Summary</div>';
  if (tabs.segments) tabsHTML += '<div class="yt-ai-tab" data-tab="segments">Segments</div>';
  if (tabs.chat) tabsHTML += '<div class="yt-ai-tab" data-tab="chat">Chat</div>';
  if (tabs.comments) tabsHTML += '<div class="yt-ai-tab" data-tab="comments">Comments</div>';
  return `<div class="yt-ai-header"><div class="yt-ai-title">✨ YouTube AI Master <span id="yt-ai-full-video-label" class="yt-ai-badge" style="display:none"></span></div><div class="yt-ai-header-actions"><button id="yt-ai-close-btn" class="yt-ai-icon-btn" title="Close">❌</button></div></div><div class="yt-ai-tabs">${tabsHTML}</div><div id="yt-ai-content-area" class="yt-ai-content"><div class="yt-ai-loading"><div class="yt-ai-spinner"></div><div class="yt-ai-loading-text">Initializing...</div></div></div><div id="yt-ai-resize-handle" class="yt-ai-resize-handle" title="Drag to resize">⋮</div><div id="yt-ai-chat-input-area" class="yt-ai-chat-input" style="display:none;"><input type="text" id="yt-ai-chat-input" placeholder="Ask about this video..."><button id="yt-ai-chat-send">Send</button></div>`;
}
