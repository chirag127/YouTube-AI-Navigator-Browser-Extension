/**
 * Global state management for content script
 */

export const state = {
    currentVideoId: null,
    isAnalyzing: false,
    analysisData: null,
    currentTranscript: [],
    settings: {
        autoAnalyze: true,
        autoSkipSponsors: false,
        autoSkipIntros: false
    }
}

/**
 * Reset state for new video
 */
export function resetState() {
    state.isAnalyzing = false
    state.analysisData = null
    state.currentTranscript = []
}

/**
 * Load settings from storage
 * @returns {Promise<Object>}
 */
export async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            'autoAnalyze',
            'autoSkipSponsors',
            'autoSkipIntros'
        ])
        Object.assign(state.settings, result)
        return state.settings
    } catch (e) {
        console.warn('Failed to load settings:', e)
        return state.settings
    }
}
