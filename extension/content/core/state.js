export const state = { currentVideoId: null, isAnalyzing: false, analysisData: null, currentTranscript: [], settings: { autoAnalyze: true, autoSkipSponsors: false, autoSkipIntros: false } }
export function resetState() { state.isAnalyzing = false; state.analysisData = null; state.currentTranscript = [] }
export async function loadSettings() {
    try {
        const r = await chrome.storage.sync.get(['autoAnalyze', 'autoSkipSponsors', 'autoSkipIntros'])
        Object.assign(state.settings, r)
        return state.settings
    } catch (e) { return state.settings }
}
