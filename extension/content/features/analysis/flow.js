import { state } from "../../core/state.js";
import TranscriptExtractor from "../../transcript/extractor.js";
import metadataExtractor from "../../metadata/extractor.js";
import { showLoading, showError } from "../../ui/components/loading.js";
import { renderSummary } from "../../ui/renderers/summary.js";
import { injectSegmentMarkers } from "../../segments/markers.js";
import { setupAutoSkip } from "../../segments/autoskip.js";
import { renderTimeline } from "../../segments/timeline.js";
import { analyzeVideo } from "./service.js";

export async function startAnalysis() {
    if (state.isAnalyzing || !state.currentVideoId) return;
    state.isAnalyzing = true;
    const contentArea = document.getElementById("yt-ai-content-area");

    try {
        // 1. Metadata
        showLoading(contentArea, "Extracting video metadata...");
        const metadata = await metadataExtractor.extract(state.currentVideoId);

        // 2. Transcript
        showLoading(contentArea, "Extracting transcript...");
        const transcript = await TranscriptExtractor.extract(state.currentVideoId);

        if (!transcript?.length) {
            throw new Error("No transcript available for this video");
        }
        state.currentTranscript = transcript;

        // 3. AI Analysis
        showLoading(contentArea, `Analyzing ${transcript.length} segments with AI...`);
        const result = await analyzeVideo(transcript, metadata);

        if (!result.success) {
            throw new Error(result.error || "Analysis failed");
        }

        state.analysisData = result.data;

        // 4. Post-processing (Segments, UI)
        if (state.analysisData.segments) {
            injectSegmentMarkers(state.analysisData.segments);
            setupAutoSkip(state.analysisData.segments);

            const video = document.querySelector("video");
            if (video) {
                renderTimeline(state.analysisData.segments, video.duration);
            }
        }

        renderSummary(contentArea, state.analysisData);

    } catch (error) {
        showError(contentArea, error.message);
    } finally {
        state.isAnalyzing = false;
    }
}
