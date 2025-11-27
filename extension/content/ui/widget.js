import { findSecondaryColumn } from '../utils/dom.js'
import { initTabs } from './tabs.js'
import { attachEventListeners } from '../handlers/events.js'
let widgetContainer = null
export async function injectWidget() {
  const e = document.getElementById('yt-ai-master-widget'); if (e) e.remove()
  const t = findSecondaryColumn(); if (!t) { setTimeout(injectWidget, 2000); return }
  widgetContainer = document.createElement('div')
  widgetContainer.id = 'yt-ai-master-widget'
  widgetContainer.innerHTML = `<div class="yt-ai-header"><div class="yt-ai-title">✨ YouTube AI Master</div><div class="yt-ai-header-actions"><button id="yt-ai-refresh-btn" class="yt-ai-icon-btn" title="Re-analyze">🔄</button><button id="yt-ai-settings-btn" class="yt-ai-icon-btn" title="Settings">⚙️</button></div></div><div class="yt-ai-tabs"><div class="yt-ai-tab active" data-tab="summary">Summary</div><div class="yt-ai-tab" data-tab="transcript">Transcript</div><div class="yt-ai-tab" data-tab="segments">Segments</div><div class="yt-ai-tab" data-tab="chat">Chat</div><div class="yt-ai-tab" data-tab="comments">Comments</div></div><div id="yt-ai-content-area" class="yt-ai-content"><div class="yt-ai-loading"><div class="yt-ai-spinner"></div><div class="yt-ai-loading-text">Initializing...</div></div></div><div id="yt-ai-chat-input-area" class="yt-ai-chat-input" style="display:none;"><input type="text" id="yt-ai-chat-input" placeholder="Ask about this video..."><button id="yt-ai-chat-send">Send</button></div>`
  t.insertBefore(widgetContainer, t.firstChild)
  initTabs(widgetContainer)
  attachEventListeners(widgetContainer)
}
export function getWidget() { return widgetContainer }
