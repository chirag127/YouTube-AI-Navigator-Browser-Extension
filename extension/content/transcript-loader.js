// Load transcript when video page loads

import { isVideoPage, getCurrentVideoId } from "../services/video/detector.js";
import { TranscriptExtractor } from "./transcript/extractor.js";
import { getCached, setCached } from "../services/transcript/cache.js";

/**
 * Load transcript for current video
 * @param {string} [languageCode] - Preferred language
 * @returns {Promise<Array>} Transcript segments
 */
export async function loadTranscript(languageCode) {
    if (!isVideoPage()) {
        throw new Error("Not on a video page");
    }

    const videoId = getCurrentVideoId();
    if (!videoId) {
        throw new Error("Could not extract video ID");
    }

    // Check cache first
    const cached = getCached(videoId, languageCode || "default");
    if (cached) {
        return cached;
    }

    // Use TranscriptExtractor
    const transcript = await TranscriptExtractor.extract(videoId, {
        lang: languageCode,
    });

    if (!transcript || transcript.length === 0) {
        throw new Error("No captions available");
    }

    // Cache result
    setCached(videoId, languageCode || "default", transcript);

    return transcript;
}

/**
 * Initialize transcript loading on page load
 */
export function initTranscriptLoader() {
    if (!isVideoPage()) {
        return;
    }

    // We don't need to poll for captions anymore since TranscriptExtractor handles it
    console.log("Transcript service ready (using TranscriptExtractor)");
}
