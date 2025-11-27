/**
 * Analysis orchestration
 */

import { state } from './state.js'
import { TranscriptService } from '../transcript/service.js'
import { showLoading, showError } from '../ui/components/loading.js'
import { renderSummary } from '../ui/renderers/summary.js'
import { injectSegmentMarkers } from '../segments/markers.js'
import { setupAutoSkip } from '../segments/autoskip.js'

const transcriptService = new TranscriptService()

/**
 * Start video analysis
 */
export async function startAnalysis() {
    if (state.isAnalyzing || !state.currentVideoId) return

    state.isAnalyzing = true
    const container = document.getElementById('yt-ai-content-area')

    try {
        // Step 1: Get transcript
        showLoading(container, 'Fetching transcript...')
        const metadata = await transcriptService.getMetadata(state.currentVideoId)

        showLoading(container, 'Extracting transcript (4 fallback methods)...')
        state.currentTranscript = await transcriptService.getTranscript(state.currentVideoId)

        if (!state.currentTranscript?.length) {
            throw new Error('No transcript available for this video')
        }

        // Step 2: AI Analysis
        showLoading(container, `Analyzing ${state.currentTranscript.length} segments with AI...`)
        const response = await chrome.runtime.sendMessage({
            action: 'ANALYZE_VIDEO',
            transcript: state.currentTranscript,
            metadata: { ...metadata, videoId: state.currentVideoId },
            options: { length: 'Medium' }
        })

        if (!response.success) {
            throw new Error(response.error || 'Analysis failed')
        }

        state.analysisData = response.data

        // Step 3: Visual enhancements
        if (state.analysisData.segments) {
            injectSegmentMarkers(state.analysisData.segments)
            setupAutoSkip(state.analysisData.segments)
        }

        // Step 4: Render
        renderSummary(container, state.analysisData)

    } catch (error) {
        console.error('Analysis error:', error)
        showError(container, error.message)
    } finally {
        state.isAnalyzing = false
    }
}
