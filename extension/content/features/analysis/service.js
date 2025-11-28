/**
 * Sends analysis request to background service
 */
export async function analyzeVideo(transcript, metadata, options = { length: "Medium" }) {
    return chrome.runtime.sendMessage({
        action: "ANALYZE_VIDEO",
        transcript,
        metadata,
        options,
    });
}
