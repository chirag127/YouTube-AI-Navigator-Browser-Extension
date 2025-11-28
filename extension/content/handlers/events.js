import { startAnalysis } from '../core/analyzer.js'
import { state } from '../core/state.js'
import { sendChatMessage } from './chat.js'
export function attachEventListeners(w) {
    const r = w.querySelector('#yt-ai-refresh-btn')
    if (r) r.addEventListener('click', () => { if (!state.isAnalyzing) startAnalysis() })

    const s = w.querySelector('#yt-ai-settings-btn')
    if (s) {
        s.addEventListener('click', () => {
            // Send message to background to open options
            chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS' });
        });
    }

    const c = w.querySelector('#yt-ai-chat-send')
    if (c) c.addEventListener('click', sendChatMessage)
    const i = w.querySelector('#yt-ai-chat-input')
    if (i) i.addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage() })
}
