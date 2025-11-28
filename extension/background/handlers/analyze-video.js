import { initializeServices, getServices } from "../services.js";
import { getApiKey } from "../utils/api-key.js";
import geniusLyricsAPI from "../../api/genius-lyrics.js";

let keepAliveInterval = null;

function startKeepAlive() {
    if (keepAliveInterval) return;
    keepAliveInterval = setInterval(
        () => chrome.runtime.getPlatformInfo(() => {}),
        20000
    );
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

export async function handleAnalyzeVideo(request, sendResponse) {
    const {
        transcript,
        metadata,
        comments = [],
        options = {},
        useCache = true,
    } = request;
    const videoId = metadata?.videoId;
    startKeepAlive();

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            sendResponse({ success: false, error: "API Key not configured" });
            return;
        }

        await initializeServices(apiKey);
        const { gemini, segmentClassification, storage } = getServices();

        if (useCache && videoId) {
            const cached = await storage.getVideoData(videoId);
            // Only use cache if we have summary AND segments (and segments is not empty array)
            if (
                cached?.summary &&
                cached?.segments &&
                cached.segments.length > 0
            ) {
                console.log(
                    "[AnalyzeVideo] Returning cached data with segments"
                );
                sendResponse({
                    success: true,
                    fromCache: true,
                    data: {
                        summary: cached.summary,
                        faq: cached.faq,
                        insights: cached.insights,
                        segments: cached.segments,
                        timestamps: cached.timestamps,
                    },
                });
                return;
            } else if (cached?.summary) {
                console.log(
                    "[AnalyzeVideo] Cache exists but segments missing/empty. Re-generating segments..."
                );
                // If we have summary but no segments, we might want to just generate segments
                // But for simplicity and robustness, let's re-run the whole flow or at least the segment part.
                // Given the structure, we'll proceed to generate.
            }
        }

        let lyrics = null;
        const isMusic =
            metadata?.category === "Music" ||
            metadata?.title?.toLowerCase().includes("official video") ||
            metadata?.title?.toLowerCase().includes("lyrics");

        if (isMusic || !transcript?.length) {
            try {
                lyrics = await geniusLyricsAPI.getLyrics(
                    metadata.title,
                    metadata.author
                );
            } catch (e) {}
        }

        if ((!transcript || !transcript.length) && !lyrics) {
            throw new Error("No transcript or lyrics available");
        }

        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, "0")}`;
        };

        // Construct Unified Context
        const analysisContext = {
            transcript: transcript || [],
            lyrics: lyrics,
            comments: comments || [],
            metadata: metadata,
        };

        const analysis = await gemini.generateComprehensiveAnalysis(
            analysisContext,
            {
                model: "gemini-2.5-flash-lite-preview-09-2025",
                language: options.language || "English",
                length: options.length || "Medium",
            }
        );

        let segments = [];
        console.log("[AnalyzeVideo] Options:", JSON.stringify(options));
        if (options.generateSegments !== false) {
            console.log("[AnalyzeVideo] Generating segments...");
            segments = await segmentClassification.classifyTranscript({
                transcript: transcript || [],
                metadata,
                lyrics,
                comments,
            });
            console.log("[AnalyzeVideo] Segments generated:", segments.length);
        } else {
            console.log(
                "[AnalyzeVideo] Segment generation disabled in options"
            );
        }

        if (videoId && storage) {
            try {
                await storage.saveVideoData(videoId, {
                    metadata,
                    transcript,
                    summary: analysis.summary,
                    faq: analysis.faq || "",
                    insights: analysis.insights || "",
                    segments,
                    timestamps: analysis.timestamps,
                });
            } catch (e) {}
        }

        sendResponse({
            success: true,
            fromCache: false,
            data: {
                summary: analysis.summary,
                faq: analysis.faq,
                insights: analysis.insights,
                segments,
                timestamps: analysis.timestamps,
            },
        });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    } finally {
        stopKeepAlive();
    }
}
