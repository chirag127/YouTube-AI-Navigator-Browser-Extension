/**
 * Event handlers
 */

import { startAnalysis } from '../core/analyzer.js'
import { state } from '../core/state.js'
import { sendChatMessage } from './chat.js'

/**
 * Attach all event listeners to widget
 */
export function attachEventListeners(widget) {
    // Refresh button
    const refreshBtn = widget.querySelector('#yt-ai-refresh-btn')
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (!state.isAnalyzing) startAnalysis()
        })
    }

    // Settings button
    const settingsBtn = widget.querySelector('#yt-ai-settings-btn')
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage()
        })
    }

    // Chat send button
    const chatSendBtn = widget.querySelector('#yt-ai-chat-send')
    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', sendChatMessage)
    }

    // Chat input enter key
    const chatInput = widget.querySelector('#yt-ai-chat-input')
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage()
        })
    }
}
