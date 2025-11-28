import { ChunkingService } from "../services/chunking/index.js";
import { GeminiService } from "../services/gemini/index.js";
import { SegmentClassificationService } from "../services/segments/index.js";
import { StorageService } from "../services/storage/index.js";
import { verifySender } from "./security/sender-check.js";
import { validateMessage, sanitizeRequest } from "./security/validator.js";

let geminiService,
    chunkingService,
    segmentClassificationService,
    storageService,
    keepAliveInterval = null;

async function initializeServices(apiKey) {
    if (!apiKey) throw new Error("API Key required");
    geminiService = new GeminiService(apiKey);
    chunkingService = new ChunkingService();
    segmentClassificationService = new SegmentClassificationService(
        geminiService,
        chunkingService
    );
    storageService = new StorageService();
    try {
        await geminiService.fetchAvailableModels();
    } catch (e) {}
}

function startKeepAlive() {
    if (keepAliveInterval) return;
    keepAliveInterval = setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {});
    }, 20000);
}

function stopKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

async function getApiKey() {
    const s = await chrome.storage.sync.get("apiKey");
    if (s.apiKey) return s.apiKey;
    const l = await chrome.storage.local.get("geminiApiKey");
    return l.geminiApiKey || null;
}

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        console.log("YouTube AI Master installed");
        chrome.runtime.openOptionsPage();
    } else if (details.reason === "update") {
        console.log(
            "YouTube AI Master updated to version",
            chrome.runtime.getManifest().version
        );
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Security: Verify sender
    if (!verifySender(sender)) {
        console.warn("[Security] Rejected message from untrusted sender");
        sendResponse({ success: false, error: "Unauthorized" });
        return false;
    }

    // Security: Validate message
    const validation = validateMessage(request);
    if (!validation.valid) {
        console.warn("[Security] Invalid message:", validation.error);
        sendResponse({ success: false, error: validation.error });
        return false;
    }

    // Security: Sanitize inputs
    const sanitized = sanitizeRequest(request);
    const action = sanitized.action || sanitized.type;
    console.log("Background received message:", action);
    (async () => {
        try {
            switch (action) {
                case "TEST":
                    sendResponse({
                        success: true,
                        message: "Background script is running",
                    });
                    break;

                case "GET_SETTINGS":
                    await handleGetSettings(sendResponse);
                    break;

                case "FETCH_TRANSCRIPT":
                    await handleFetchTranscript(sanitized, sendResponse);
                    break;

                case "ANALYZE_VIDEO":
                    await handleAnalyzeVideo(sanitized, sendResponse);
                    break;

                case "ANALYZE_COMMENTS":
                    await handleAnalyzeComments(sanitized, sendResponse);
                    break;

                case "GENERATE_SUMMARY":
                    await handleGenerateSummary(sanitized, sendResponse);
                    break;

                case "CLASSIFY_SEGMENTS":
                    await handleClassifySegments(sanitized, sendResponse);
                    break;

                case "CHAT_WITH_VIDEO":
                    await handleChatWithVideo(sanitized, sendResponse);
                    break;

                case "SAVE_TO_HISTORY":
                    await handleSaveToHistory(sanitized, sendResponse);
                    break;

                case "GET_METADATA":
                    await handleGetMetadata(sanitized, sendResponse);
                    break;

                case "FETCH_INVIDIOUS_TRANSCRIPT": {
                    const result = await handleFetchInvidiousTranscript(
                        sanitized
                    );
                    sendResponse(result);
                    break;
                }

                case "FETCH_INVIDIOUS_METADATA": {
                    const result = await handleFetchInvidiousMetadata(
                        sanitized
                    );
                    sendResponse(result);
                    break;
                }

                case "FETCH_PIPED_METADATA": {
                    const result = await handleFetchPipedMetadata(sanitized);
                    sendResponse(result);
                    break;
                }

                case "FETCH_PIPED_TRANSCRIPT": {
                    const result = await handleFetchPipedTranscript(sanitized);
                    sendResponse(result);
                    break;
                }

                case "ANALYZE_VIDEO_STREAMING":
                    await handleAnalyzeVideoStreaming(sanitized, sendResponse);
                    break;

                case "GET_CACHED_DATA":
                    await handleGetCachedData(sanitized, sendResponse);
                    break;

                case "SAVE_CHAT_MESSAGE":
                    await handleSaveChatMessage(sanitized, sendResponse);
                    break;

                case "SAVE_COMMENTS":
                    await handleSaveComments(sanitized, sendResponse);
                    break;

                case "OPEN_OPTIONS":
                    chrome.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;

                default:
                    console.warn("Unknown message type:", action);
                    sendResponse({
                        success: false,
                        error: "Unknown message type",
                    });
            }
        } catch (error) {
            console.error("Background handler error:", error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    return true;
});

async function handleGetSettings(sendResponse) {
    const settings = await chrome.storage.sync.get([
        "apiKey",
        "model",
        "summaryLength",
        "outputLanguage",
        "customPrompt",
        "enableSegments",
        "autoSkipSponsors",
        "autoSkipIntros",
        "saveHistory",
    ]);
    sendResponse({ success: true, data: settings });
}

async function handleFetchTranscript(request, sendResponse) {
    const { videoId, lang = "en" } = request;
    console.log(
        `[Transcript] 🔍 Fetching transcript for ${videoId}, lang: ${lang}`
    );

    const methods = [
        {
            name: "Invidious API",
            fn: () => handleFetchInvidiousTranscript(request),
        },
        {
            name: "YouTube Direct API",
            fn: () => fetchYouTubeDirectAPI(videoId, lang),
        },
    ];

    let lastError = null;

    for (const method of methods) {
        try {
            console.log(`[Transcript] Trying ${method.name}...`);
            const result = await method.fn();

            if (result.success && result.data) {
                console.log(`[Transcript] ✅ ${method.name} succeeded`);
                sendResponse(result);
                return;
            }
        } catch (e) {
            lastError = e;
            console.warn(`[Transcript] ${method.name} failed:`, e.message);
        }
    }

    sendResponse({
        success: false,
        error: lastError?.message || "All transcript fetch methods failed",
    });
}

async function fetchYouTubeDirectAPI(videoId, lang = "en") {
    const formats = ["json3", "srv3"];

    for (const fmt of formats) {
        try {
            const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}`;
            const response = await fetch(url);

            if (!response.ok) continue;

            if (fmt === "json3") {
                try {
                    const text = await response.text();
                    if (!text) continue;

                    const data = JSON.parse(text);
                    if (data.events) {
                        const segments = data.events
                            .filter((e) => e.segs)
                            .map((e) => ({
                                start: e.tStartMs / 1000,
                                duration: (e.dDurationMs || 0) / 1000,
                                text: e.segs.map((s) => s.utf8).join(""),
                            }));

                        if (segments.length > 0) {
                            return { success: true, data: segments };
                        }
                    }
                } catch (e) {
                    console.warn(`[YouTube API] JSON parse failed:`, e.message);
                }
            } else {
                const xmlText = await response.text();
                const segments = parseXML(xmlText);
                if (segments.length > 0) {
                    return { success: true, data: segments };
                }
            }
        } catch (e) {
            console.warn(`[YouTube API] Format ${fmt} failed:`, e.message);
        }
    }

    return { success: false, error: "YouTube Direct API failed" };
}

function parseXML(xmlText) {
    const segments = [];
    const regex =
        /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = regex.exec(xmlText)) !== null) {
        const start = parseFloat(match[1]);
        const duration = match[2] ? parseFloat(match[2]) : 0;
        const text = decodeHTMLEntities(match[3]);

        if (text.trim()) {
            segments.push({ start, duration, text });
        }
    }

    return segments;
}

function decodeHTMLEntities(text) {
    const entities = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&nbsp;": " ",
    };

    return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

async function handleAnalyzeVideo(request, sendResponse) {
    const { transcript, metadata, options = {}, useCache = true } = request;
    const videoId = metadata?.videoId;
    startKeepAlive();

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            sendResponse({
                success: false,
                error: "API Key not configured. Please set your Gemini API key in extension options.",
            });
            return;
        }

        await initializeServices(apiKey);

        if (useCache && videoId) {
            const cached = await storageService.getVideoData(videoId);
            if (cached?.summary && cached?.segments) {
                console.log("[Cache] Using cached analysis for", videoId);
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
            }
        }

        // Pass metadata to the analysis
        const analysis =
            await geminiService.generateStreamingSummaryWithTimestamps(
                transcript,
                {
                    model: "gemini-2.5-flash-lite-preview-09-2025",
                    language: options.language || "English",
                    length: options.length || "Medium",
                    metadata: metadata, // Include video metadata for better context
                }
            );

        let segments = [];
        try {
            segments = await segmentClassificationService.classifyTranscript(
                transcript
            );
        } catch (e) {
            console.warn("Segment classification failed:", e);
        }

        if (videoId && storageService) {
            try {
                await storageService.saveVideoData(videoId, {
                    metadata,
                    transcript,
                    summary: analysis.summary,
                    faq: analysis.faq || "",
                    insights: analysis.insights || "",
                    segments,
                    timestamps: analysis.timestamps,
                });
            } catch (e) {
                console.warn("Failed to save to cache:", e);
            }
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
    } finally {
        stopKeepAlive();
    }
}

async function handleAnalyzeComments(request, sendResponse) {
    const { comments } = request;

    const apiKey = await getApiKey();
    if (!apiKey) {
        sendResponse({ success: false, error: "API Key not configured" });
        return;
    }

    await initializeServices(apiKey);

    const analysis = await geminiService.analyzeCommentSentiment(comments);
    sendResponse({ success: true, analysis });
}

async function handleGenerateSummary(request, sendResponse) {
    const { transcript, settings, metadata } = request;

    const apiKey = settings?.apiKey || (await getApiKey());
    if (!apiKey) {
        sendResponse({ success: false, error: "API Key not configured" });
        return;
    }

    await initializeServices(apiKey);

    const summary = await geminiService.generateSummary(
        transcript,
        settings?.customPrompt,
        settings?.model,
        {
            length: settings?.summaryLength,
            language: settings?.outputLanguage,
            metadata: metadata, // Include metadata for better summaries
        }
    );

    sendResponse({ success: true, data: summary });
}

async function handleClassifySegments(request, sendResponse) {
    const { transcript, settings } = request;

    const apiKey = settings?.apiKey || (await getApiKey());
    if (!apiKey) {
        sendResponse({ success: false, error: "API Key not configured" });
        return;
    }

    await initializeServices(apiKey);

    const segments = await segmentClassificationService.classifyTranscript(
        transcript
    );
    sendResponse({ success: true, data: segments });
}

async function handleChatWithVideo(request, sendResponse) {
    const { question, context, metadata } = request;

    const apiKey = await getApiKey();
    if (!apiKey) {
        sendResponse({ success: false, error: "API Key not configured" });
        return;
    }

    await initializeServices(apiKey);

    // Pass metadata to chat for better context
    const answer = await geminiService.chatWithVideo(
        question,
        context,
        null,
        metadata
    );
    sendResponse({ success: true, answer });
}

async function handleSaveToHistory(request, sendResponse) {
    const { videoId, title, summary, timestamp } = request.data || request;

    const result = await chrome.storage.local.get("summaryHistory");
    const history = result.summaryHistory || [];

    history.unshift({
        videoId,
        title,
        summary,
        timestamp: timestamp || Date.now(),
    });

    const trimmedHistory = history.slice(0, 100);
    await chrome.storage.local.set({ summaryHistory: trimmedHistory });

    sendResponse({ success: true });
}

async function handleGetMetadata(request, sendResponse) {
    const { videoId } = request;
    console.warn(
        "[Background] GET_METADATA called - this should be handled by content script"
    );

    sendResponse({
        success: true,
        data: {
            title: "YouTube Video",
            author: "Unknown Channel",
            viewCount: "Unknown",
            videoId: videoId,
        },
    });
}

async function handleFetchInvidiousTranscript(request) {
    const { videoId, lang = "en" } = request;
    console.log(
        `[Invidious] 🔍 Fetching transcript for ${videoId}, lang: ${lang}`
    );

    const instances = await getInvidiousInstances();
    console.log(`[Invidious] 📡 Testing ${instances.length} instances`);

    let lastError = null;

    for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        try {
            console.log(
                `[Invidious] 🔄 Trying instance ${i + 1}/${
                    instances.length
                }: ${inst}`
            );

            const videoUrl = `${inst}/api/v1/videos/${videoId}`;
            console.log(`[Invidious] 📥 Fetching video data: ${videoUrl}`);

            const videoResponse = await fetch(videoUrl, {
                signal: AbortSignal.timeout(8000),
            });

            if (!videoResponse.ok) {
                console.warn(
                    `[Invidious] ⚠️ Instance ${inst} returned HTTP ${videoResponse.status}`
                );
                continue;
            }

            const videoData = await videoResponse.json();
            console.log(`[Invidious] 📊 Video data received:`, {
                title: videoData.title,
                captionsCount: videoData.captions?.length || 0,
            });

            if (!videoData.captions || videoData.captions.length === 0) {
                console.warn(
                    `[Invidious] ⚠️ No captions available for this video`
                );
                lastError = new Error("No captions available");
                continue;
            }

            let captionTrack = videoData.captions.find(
                (c) => c.language_code === lang
            );
            if (!captionTrack) {
                console.log(
                    `[Invidious] 🔄 Language '${lang}' not found, using first available: ${videoData.captions[0].language_code}`
                );
                captionTrack = videoData.captions[0];
            }

            console.log(`[Invidious] 📝 Selected caption:`, {
                label: captionTrack.label,
                languageCode: captionTrack.language_code,
                url: captionTrack.url,
            });

            const captionUrl = captionTrack.url.startsWith("http")
                ? captionTrack.url
                : `${inst}${captionTrack.url}`;

            console.log(`[Invidious] 📥 Fetching captions from: ${captionUrl}`);

            const captionResponse = await fetch(captionUrl, {
                signal: AbortSignal.timeout(10000),
                headers: {
                    Accept: "text/vtt,text/plain,*/*",
                },
            });

            if (!captionResponse.ok) {
                console.warn(
                    `[Invidious] ⚠️ Caption fetch failed: HTTP ${captionResponse.status}`
                );
                continue;
            }

            const captionText = await captionResponse.text();
            console.log(
                `[Invidious] 📄 Caption data received: ${captionText.length} bytes`
            );

            const segments = parseVTT(captionText);
            console.log(
                `[Invidious] ✅ Successfully parsed ${segments.length} segments`
            );

            return { success: true, data: segments };
        } catch (e) {
            lastError = e;
            console.error(`[Invidious] ❌ Instance ${inst} failed:`, e.message);
            continue;
        }
    }

    console.error(
        `[Invidious] ❌ All instances failed. Last error:`,
        lastError?.message
    );
    return {
        success: false,
        error: lastError?.message || "All Invidious instances failed",
    };
}

async function handleFetchInvidiousMetadata(request) {
    const { videoId } = request;
    console.log(`[Invidious] 🔍 Fetching metadata for ${videoId}`);

    const instances = await getInvidiousInstances();

    for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        try {
            console.log(
                `[Invidious] 🔄 Trying instance ${i + 1}/${
                    instances.length
                }: ${inst}`
            );

            const url = `${inst}/api/v1/videos/${videoId}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(8000),
            });

            if (!response.ok) {
                console.warn(
                    `[Invidious] ⚠️ Instance ${inst} returned HTTP ${response.status}`
                );
                continue;
            }

            const data = await response.json();

            const metadata = {
                videoId: data.videoId,
                title: data.title,
                author: data.author,
                authorId: data.authorId,
                lengthSeconds: data.lengthSeconds,
                duration: data.lengthSeconds,
                viewCount: data.viewCount,
                likeCount: data.likeCount,
                published: data.published,
                description: data.description,
                keywords: data.keywords || [],
                genre: data.genre,
                captionsAvailable: (data.captions?.length || 0) > 0,
                availableLanguages:
                    data.captions?.map((c) => c.language_code) || [],
            };

            console.log(`[Invidious] ✅ Metadata fetched successfully:`, {
                title: metadata.title,
                author: metadata.author,
                captionsAvailable: metadata.captionsAvailable,
            });

            return { success: true, data: metadata };
        } catch (e) {
            console.error(`[Invidious] ❌ Instance ${inst} failed:`, e.message);
            continue;
        }
    }

    console.error(`[Invidious] ❌ All instances failed for metadata`);
    return {
        success: false,
        error: "Failed to fetch metadata from Invidious",
    };
}

let cachedInstances = null;
let instancesCacheTime = 0;
const INSTANCES_CACHE_DURATION = 5 * 60 * 1000;

async function getInvidiousInstances() {
    const now = Date.now();

    if (
        cachedInstances &&
        now - instancesCacheTime < INSTANCES_CACHE_DURATION
    ) {
        console.log(
            `[Invidious] 📦 Using cached instances (${cachedInstances.length} instances)`
        );
        return cachedInstances;
    }

    console.log(`[Invidious] 🔍 Fetching fresh instance list from live API...`);

    const fallbackInstances = [
        "https://inv.perditum.com",
        "https://inv.nadeko.net",
        "https://invidious.nerdvpn.de",
        "https://invidious.drgns.space",
        "https://inv.tux.pizza",
        "https://invidious.jing.rocks",
    ];

    try {
        const r = await fetch(
            "https://api.invidious.io/instances.json?sort_by=type,users",
            {
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!r.ok) {
            console.warn(
                `[Invidious] ⚠️ Instance API returned HTTP ${r.status}, using fallback`
            );
            cachedInstances = fallbackInstances;
            instancesCacheTime = now;
            return fallbackInstances;
        }

        const data = await r.json();
        console.log(
            `[Invidious] 📊 Received ${data.length} total instances from API`
        );

        const instances = data
            .filter((entry) => {
                const [_domain, info] = entry;
                if (info?.type !== "https") return false;
                if (info?.api === false) return false;
                if (info?.monitor?.down === true) return false;
                if (!info?.uri) return false;
                if (info?.api?.restricted === true) return false;
                return true;
            })
            .sort((a, b) => {
                const uptimeA = a[1]?.monitor?.uptime || 0;
                const uptimeB = b[1]?.monitor?.uptime || 0;
                return uptimeB - uptimeA;
            })
            .slice(0, 15)
            .map((entry) => entry[1].uri);

        // Ensure inv.perditum.com is first
        const priorityInstance = "https://inv.perditum.com";
        const priorityIndex = instances.indexOf(priorityInstance);
        if (priorityIndex > -1) {
            instances.splice(priorityIndex, 1);
        }
        instances.unshift(priorityInstance);

        if (instances.length > 0) {
            console.log(
                `[Invidious] ✅ Fetched ${instances.length} active instances with API enabled`
            );
            console.log(`[Invidious] 📋 Top instances:`, instances.slice(0, 5));
            cachedInstances = instances;
            instancesCacheTime = now;
            return instances;
        } else {
            console.warn(
                `[Invidious] ⚠️ No valid instances found in API response, using fallback`
            );
            cachedInstances = fallbackInstances;
            instancesCacheTime = now;
            return fallbackInstances;
        }
    } catch (e) {
        console.error(
            `[Invidious] ❌ Failed to fetch instances from API:`,
            e.message
        );
        cachedInstances = fallbackInstances;
        instancesCacheTime = now;
        return fallbackInstances;
    }
}

function parseVTT(vttText) {
    console.log(`[Parser] 🔍 Parsing VTT format (${vttText.length} bytes)`);

    const segments = [];
    const lines = vttText.split("\n");
    let i = 0;
    let segmentCount = 0;

    while (i < lines.length) {
        const line = lines[i].trim();

        if (line.includes("-->")) {
            const [startStr, endStr] = line.split("-->").map((t) => t.trim());
            const start = parseVTTTime(startStr);
            const end = parseVTTTime(endStr);

            i++;
            let text = "";
            while (
                i < lines.length &&
                lines[i].trim() !== "" &&
                !lines[i].includes("-->")
            ) {
                text += lines[i].trim() + " ";
                i++;
            }

            text = text
                .trim()
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ");

            if (text) {
                segments.push({
                    start,
                    duration: end - start,
                    text,
                });
                segmentCount++;
            }
        }
        i++;
    }

    console.log(`[Parser] ✅ Parsed ${segmentCount} VTT segments`);
    return segments;
}

function parseVTTTime(timestamp) {
    const parts = timestamp.split(":");

    if (parts.length === 3) {
        const [h, m, s] = parts;
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
    } else if (parts.length === 2) {
        const [m, s] = parts;
        return parseFloat(m) * 60 + parseFloat(s);
    } else {
        return parseFloat(parts[0]);
    }
}

chrome.runtime.onConnect.addListener((port) => {
    console.log("Port connected:", port.name);
});

console.log("YouTube AI Master service worker loaded");

async function handleAnalyzeVideoStreaming(request, sendResponse) {
    const { transcript, metadata, options = {}, tabId } = request;
    const videoId = metadata?.videoId;

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            sendResponse({ success: false, error: "API Key not configured" });
            return;
        }

        await initializeServices(apiKey);

        const cached = await storageService.getVideoData(videoId);
        if (cached?.summary) {
            chrome.tabs.sendMessage(tabId, {
                type: "ANALYSIS_CHUNK",
                chunk: cached.summary,
                fullText: cached.summary,
                timestamps: cached.timestamps || [],
                isComplete: true,
                fromCache: true,
            });
            sendResponse({ success: true, fromCache: true });
            return;
        }

        // Pass metadata to the streaming analysis
        await geminiService.generateStreamingSummaryWithTimestamps(
            transcript,
            {
                model: "gemini-2.5-flash-lite-preview-09-2025",
                language: options.language || "English",
                length: options.length || "Medium",
                metadata: metadata, // Include video metadata for better context
            },
            (chunk, fullText, timestamps) => {
                chrome.tabs
                    .sendMessage(tabId, {
                        type: "ANALYSIS_CHUNK",
                        chunk,
                        fullText,
                        timestamps,
                        isComplete: false,
                    })
                    .catch(() => {});
            }
        );

        sendResponse({ success: true, streaming: true });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

async function handleGetCachedData(request, sendResponse) {
    const { videoId } = request;

    try {
        await initializeServices(await getApiKey());
        const data = await storageService.getVideoData(videoId);
        sendResponse({ success: true, data: data || null });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

async function handleSaveChatMessage(request, sendResponse) {
    const { videoId, role, message } = request;

    try {
        await initializeServices(await getApiKey());
        await storageService.saveChatMessage(videoId, role, message);
        sendResponse({ success: true });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

async function handleSaveComments(request, sendResponse) {
    const { videoId, comments, commentSummary } = request;

    try {
        await initializeServices(await getApiKey());
        await storageService.saveCommentsCache(
            videoId,
            comments,
            commentSummary
        );
        sendResponse({ success: true });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

async function handleFetchPipedMetadata(request) {
    const { videoId } = request;
    console.log(`[Piped] Fetching metadata for ${videoId}`);

    const instances = await getPipedInstances();

    for (let i = 0; i < Math.min(instances.length, 5); i++) {
        const instance = instances[i];
        try {
            console.log(`[Piped] Trying instance ${i + 1}: ${instance}`);

            const url = `${instance}/streams/${videoId}`;
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                console.warn(
                    `[Piped] Instance ${instance} returned HTTP ${response.status}`
                );
                continue;
            }

            const data = await response.json();

            const metadata = {
                videoId: videoId,
                title: data.title || "",
                description: data.description || "",
                author: data.uploader || "",
                uploaderUrl: data.uploaderUrl || "",
                uploaderVerified: data.uploaderVerified || false,
                duration: data.duration || 0,
                views: data.views || 0,
                likes: data.likes || 0,
                dislikes: data.dislikes || 0,
                uploadDate: data.uploadDate || "",
                thumbnailUrl: data.thumbnailUrl || "",
                category: data.category || "",
                livestream: data.livestream || false,
                subtitles: data.subtitles || [],
                relatedStreams: data.relatedStreams || [],
            };

            console.log(
                `[Piped] Metadata fetched successfully from ${instance}`
            );
            return { success: true, data: metadata };
        } catch (e) {
            console.error(`[Piped] Instance ${instance} failed:`, e.message);
            continue;
        }
    }

    return {
        success: false,
        error: "All Piped instances failed for metadata",
    };
}

async function handleFetchPipedTranscript(request) {
    const { videoId, lang = "en" } = request;
    console.log(`[Piped] Fetching transcript for ${videoId}, lang: ${lang}`);

    const instances = await getPipedInstances();

    for (let i = 0; i < Math.min(instances.length, 5); i++) {
        const instance = instances[i];
        try {
            console.log(`[Piped] Trying instance ${i + 1}: ${instance}`);

            const metadataUrl = `${instance}/streams/${videoId}`;
            const metadataResponse = await fetch(metadataUrl, {
                signal: AbortSignal.timeout(10000),
            });

            if (!metadataResponse.ok) {
                console.warn(
                    `[Piped] Instance ${instance} returned HTTP ${metadataResponse.status}`
                );
                continue;
            }

            const data = await metadataResponse.json();

            if (!data.subtitles || data.subtitles.length === 0) {
                console.warn(`[Piped] No subtitles available for ${videoId}`);
                continue;
            }

            let subtitle = data.subtitles.find(
                (s) => s.code === lang && !s.autoGenerated
            );
            if (!subtitle) {
                subtitle = data.subtitles.find((s) => s.code === lang);
            }
            if (!subtitle) {
                console.log(
                    `[Piped] Language '${lang}' not found, using first available: ${data.subtitles[0].code}`
                );
                subtitle = data.subtitles[0];
            }

            console.log(
                `[Piped] Selected subtitle: ${subtitle.name} (${subtitle.code})`
            );

            const subtitleResponse = await fetch(subtitle.url, {
                signal: AbortSignal.timeout(10000),
            });

            if (!subtitleResponse.ok) {
                console.warn(
                    `[Piped] Failed to fetch subtitle: HTTP ${subtitleResponse.status}`
                );
                continue;
            }

            const subtitleText = await subtitleResponse.text();
            const segments = parseVTT(subtitleText);

            if (segments.length > 0) {
                console.log(
                    `[Piped] Transcript fetched successfully: ${segments.length} segments`
                );
                return { success: true, data: segments };
            }
        } catch (e) {
            console.error(`[Piped] Instance ${instance} failed:`, e.message);
            continue;
        }
    }

    return {
        success: false,
        error: "All Piped instances failed for transcript",
    };
}

let cachedPipedInstances = null;
let pipedInstancesCacheTime = 0;
const PIPED_CACHE_DURATION = 5 * 60 * 1000;

async function getPipedInstances() {
    const now = Date.now();

    if (
        cachedPipedInstances &&
        now - pipedInstancesCacheTime < PIPED_CACHE_DURATION
    ) {
        console.log(
            `[Piped] Using cached instances (${cachedPipedInstances.length} instances)`
        );
        return cachedPipedInstances;
    }

    const fallbackInstances = [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.syncpundit.io",
        "https://piped-api.garudalinux.org",
        "https://pipedapi.leptons.xyz",
        "https://piped-api.lunar.icu",
        "https://ytapi.dc09.ru",
    ];

    try {
        console.log("[Piped] Fetching instances from GitHub...");

        const response = await fetch(
            "https://raw.githubusercontent.com/TeamPiped/Piped/master/README.md",
            {
                signal: AbortSignal.timeout(8000),
            }
        );

        if (!response.ok) {
            console.warn("[Piped] Failed to fetch instances, using fallback");
            cachedPipedInstances = fallbackInstances;
            pipedInstancesCacheTime = now;
            return fallbackInstances;
        }

        const markdown = await response.text();
        const apiUrls = [];
        const lines = markdown.split("\n");

        for (const line of lines) {
            const match = line.match(/\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/);
            if (match) {
                const url = match[2].trim();
                if (
                    url.includes("pipedapi") ||
                    url.includes("api-piped") ||
                    url.includes("api.piped")
                ) {
                    apiUrls.push(url);
                }
            }
        }

        if (apiUrls.length > 0) {
            console.log(`[Piped] Fetched ${apiUrls.length} instances`);
            cachedPipedInstances = apiUrls;
            pipedInstancesCacheTime = now;
            return apiUrls;
        } else {
            console.warn("[Piped] No instances found, using fallback");
            cachedPipedInstances = fallbackInstances;
            pipedInstancesCacheTime = now;
            return fallbackInstances;
        }
    } catch (e) {
        console.error("[Piped] Failed to fetch instances:", e.message);
        cachedPipedInstances = fallbackInstances;
        pipedInstancesCacheTime = now;
        return fallbackInstances;
    }
}
