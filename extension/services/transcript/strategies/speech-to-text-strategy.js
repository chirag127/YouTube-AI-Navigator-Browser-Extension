// Speech to Text Strategy (Gemini AI)
// Priority: 8 (Fallback - Uses Gemini 1.5 Flash to transcribe audio)

/**
 * Extract audio URL from YouTube player response
 */
function getAudioUrl() {
    try {
        const playerResponse = window.ytInitialPlayerResponse;
        if (!playerResponse?.streamingData?.adaptiveFormats) {
            return null;
        }

        const formats = playerResponse.streamingData.adaptiveFormats;
        // Look for audio/mp4 or audio/webm
        const audioFormat = formats.find(
            (f) =>
                f.mimeType.includes("audio/mp4") ||
                f.mimeType.includes("audio/webm")
        );

        return audioFormat?.url || null;
    } catch (e) {
        console.warn("[SpeechToText] Failed to extract audio URL:", e);
        return null;
    }
}

async function fetchViaSpeechToText(videoId, lang = "en") {
    console.log(
        `[SpeechToText] Starting extraction for ${videoId}, lang: ${lang}`
    );

    const audioUrl = getAudioUrl();
    if (!audioUrl) {
        console.warn("[SpeechToText] No audio URL found");
        return null;
    }

    console.log("[SpeechToText] Found audio URL, requesting transcription...");

    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "TRANSCRIBE_AUDIO",
                audioUrl: audioUrl,
                lang: lang,
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn(
                        "[SpeechToText] Message error:",
                        chrome.runtime.lastError
                    );
                    resolve(null);
                    return;
                }

                if (response?.success && response.segments) {
                    console.log(
                        `[SpeechToText] ✅ Success: ${response.segments.length} segments`
                    );
                    resolve(response.segments);
                } else {
                    console.warn("[SpeechToText] Failed:", response?.error);
                    resolve(null);
                }
            }
        );
    });
}

export const strategy = {
    name: "Speech to Text (Gemini)",
    priority: 8,
    fetch: fetchViaSpeechToText,
};
