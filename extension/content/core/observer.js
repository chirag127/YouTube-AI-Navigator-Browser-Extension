import { state, resetState } from './state.js'
import { injectWidget } from '../ui/widget.js'
import { startAnalysis } from './analyzer.js'
export function initObserver() {
    const o = new MutationObserver(() => {
        if (window.location.pathname !== '/watch') return
        const u = new URLSearchParams(window.location.search), v = u.get('v')
        if (v && v !== state.currentVideoId) handleNewVideo(v)
    })
    o.observe(document.body, { childList: true, subtree: true })
    checkCurrentPage()
}
async function handleNewVideo(v) {
    state.currentVideoId = v
    resetState()
    await injectWidget()
    if (state.settings.autoAnalyze) setTimeout(() => startAnalysis(), 1500)
}
function checkCurrentPage() {
    if (window.location.pathname === '/watch') {
        const u = new URLSearchParams(window.location.search), v = u.get('v')
        if (v) handleNewVideo(v)
    }
}
