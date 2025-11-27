/**
 * Video detection and page observation
 */

import { state, resetState } from './state.js'
import { injectWidget } from '../ui/widget.js'
import { startAnalysis } from './analyzer.js'

/**
 * Initialize video observer
 */
export function initObserver() {
    const observer = new MutationObserver(() => {
        if (window.location.pathname !== '/watch') return

        const urlParams = new URLSearchParams(window.location.search)
        const videoId = urlParams.get('v')

        if (videoId && videoId !== state.currentVideoId) {
            handleNewVideo(videoId)
        }
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })

    // Initial check
    checkCurrentPage()
}

/**
 * Handle new video detection
 * @param {string} videoId - YouTube video ID
 */
async function handleNewVideo(videoId) {
    console.log('YouTube AI Master: New video detected:', videoId)

    state.currentVideoId = videoId
    resetState()

    await injectWidget()

    // Auto-analyze if enabled
    if (state.settings.autoAnalyze) {
        setTimeout(() => startAnalysis(), 1500)
    }
}

/**
 * Check current page on load
 */
function checkCurrentPage() {
    if (window.location.pathname === '/watch') {
        const urlParams = new URLSearchParams(window.location.search)
        const videoId = urlParams.get('v')
        if (videoId) {
            handleNewVideo(videoId)
        }
    }
}
