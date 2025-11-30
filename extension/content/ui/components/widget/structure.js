export function createWidgetHTML(cfg = {}) {
  const tabs = cfg.tabs || { summary: true, segments: true, chat: true, comments: true };
  let tabsHTML = '';
  if (tabs.summary)
    tabsHTML +=
      '\u003cdiv class="yt-ai-tab active" data-tab="summary"\u003eDefault\u003c/div\u003e';
  if (tabs.segments)
    tabsHTML += '\u003cdiv class="yt-ai-tab" data-tab="segments"\u003eSegments\u003c/div\u003e';
  if (tabs.chat)
    tabsHTML += '\u003cdiv class="yt-ai-tab" data-tab="chat"\u003eChat\u003c/div\u003e';
  if (tabs.comments)
    tabsHTML += '\u003cdiv class="yt-ai-tab" data-tab="comments"\u003eComments\u003c/div\u003e';
  return `\u003cdiv id="yt-ai-resize-handle-width" class="yt-ai-resize-handle-width" title="Drag to resize width" style="display:none;"\u003e⋮⋮⋮\u003c/div\u003e\u003cdiv class="yt-ai-header"\u003e\u003cdiv class="yt-ai-title"\u003e✨ YouTube AI Master \u003cspan id="yt-ai-full-video-label" class="yt-ai-badge" style="display:none"\u003e\u003c/span\u003e\u003c/div\u003e\u003cdiv class="yt-ai-header-actions"\u003e\u003cbutton id="yt-ai-close-btn" class="yt-ai-icon-btn" title="Close"\u003e❌\u003c/button\u003e\u003c/div\u003e\u003c/div\u003e\u003cdiv class="yt-ai-tabs"\u003e${tabsHTML}\u003c/div\u003e\u003cdiv id="yt-ai-content-area" class="yt-ai-content"\u003e\u003cdiv class="yt-ai-loading"\u003e\u003cdiv class="yt-ai-spinner"\u003e\u003c/div\u003e\u003cdiv class="yt-ai-loading-text"\u003eInitializing...\u003c/div\u003e\u003c/div\u003e\u003c/div\u003e\u003cdiv id="yt-ai-resize-handle" class="yt-ai-resize-handle" title="Drag to resize"\u003e⋮\u003c/div\u003e\u003cdiv id="yt-ai-chat-input-area" class="yt-ai-chat-input" style="display:none;"\u003e\u003cinput type="text" id="yt-ai-chat-input" placeholder="Ask about this video..."\u003e\u003cbutton id="yt-ai-chat-send"\u003eSend\u003c/button\u003e\u003c/div\u003e`;
}
