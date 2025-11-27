/**
 * YouTube AI Master - Main Entry Point
 * Modular content script for YouTube video analysis
 */

(async () => {
    // Exit if not on YouTube
    if (window.location.hostname !== 'www.youtube.com') {
        return
    }

    console.log('YouTube AI Master: Initializing...')

    try {
        // Dynamic imports for ES6 modules
        const { loadSettings } = await import(chrome.runtime.getURL('content/core/state.js'))
        const { initObserver } = await import(chrome.runtime.getURL('content/core/observer.js'))

        // Load user settings
        await loadSettings()

        // Start video observer
        initObserver()

        console.log('YouTube AI Master: Ready ✓')
    } catch (error) {
        console.error('YouTube AI Master: Initialization failed', error)
    }
})()

// Message listener for popup/sidepanel communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_ANALYSIS') {
        import(chrome.runtime.getURL('content/core/analyzer.js')).then(({ startAnalysis }) => {
            startAnalysis()
            sendResponse({ success: true })
        }).catch(error => {
            console.error('Analysis import failed:', error)
            sendResponse({ success: false, error: error.message })
        })
        return true
    }
})
