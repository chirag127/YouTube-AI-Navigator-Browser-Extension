import { fetchTranscript } from "../../services/transcript/fetcher.js";

class TranscriptExtractor {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5min
        this.interceptedTranscripts = new Map();

        // Listen for messages from Main World
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;

            if (event.data.type === "YT_TRANSCRIPT") {
                this.handleInterceptedTranscript(event.data.payload);
            }
        });
    }

    handleInterceptedTranscript(data) {
        // Try to parse and cache intercepted transcript
        try {
            // Basic parsing logic - this might need to be more robust depending on the raw data structure
            // The raw data from /api/timedtext is different from /youtubei/v1/get_transcript
            // For now, we just store it and let the extract method handle it if needed
            // or we can try to parse it here if we know the videoId.
            // Since we don't easily know the videoId here without parsing the URL or context,
            // we might just log it for now or store it by a timestamp/sequence if needed.
            // Ideally, the injected script should pass the videoId if possible, or we rely on the request URL.

            // For this implementation, we'll rely on the 'extract' method to actively fetch or check cache,
            // but we can also use this to populate the cache if we can identify the video.

            this.log("info", "Intercepted transcript data from Main World");
        } catch (e) {
            console.error("Error handling intercepted transcript:", e);
        }
    }

    log(level, msg) {
        const icons = { info: "ℹ️", success: "✅", warn: "⚠️", error: "❌" };
        const icon = icons[level] || "";
        const method =
            level === "success" || typeof console[level] !== "function"
                ? "log"
                : level;
        console[method](`[TranscriptExtractor] ${icon} ${msg}`);
    }

    async extract(
        videoId,
        { lang = "en", useCache = true, timeout = 30000 } = {}
    ) {
        this.log("info", `Extracting: ${videoId}, lang: ${lang}`);

        if (useCache) {
            const cached = this._getCache(videoId, lang);
            if (cached) {
                this.log("success", "Cache hit");
                return cached;
            }
        }

        try {
            // Try fetching via service (which uses YouTube Direct Strategy)
            const result = await fetchTranscript(videoId, lang, timeout);

            if (result?.length) {
                this.log("success", `${result.length} segments extracted`);
                this._setCache(videoId, lang, result);
                return result;
            }

            throw new Error("Empty result from fetcher");
        } catch (e) {
            this.log("error", e.message);
            throw e;
        }
    }

    getAvailableTracks() {
        const pr = getPlayerResponse();
        return (
            pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks || []
        );
    }

    getAvailableLanguages() {
        return this.getAvailableTracks().map((t) => ({
            code: t.languageCode,
            name: t.name?.simpleText || t.languageCode,
            kind: t.kind,
        }));
    }

    hasCaptions() {
        return this.getAvailableTracks().length > 0;
    }

    formatWithTimestamps(segments) {
        return segments
            .map((s) => `[${formatTime(s.start)}] ${s.text}`)
            .join("\n");
    }

    formatPlainText(segments) {
        return segments.map((s) => s.text).join(" ");
    }

    _getCache(videoId, lang) {
        const cached = this.cache.get(`${videoId}_${lang}`);
        return cached && Date.now() - cached.ts < this.cacheTimeout
            ? cached.data
            : null;
    }

    _setCache(videoId, lang, data) {
        this.cache.set(`${videoId}_${lang}`, { data, ts: Date.now() });
    }

    clearCache() {
        this.cache.clear();
        this.log("info", "Cache cleared");
    }

    async getInitialData() {
        return new Promise((resolve) => {
            const listener = (event) => {
                if (event.source !== window) return;
                if (event.data.type === "YT_DATA_RESPONSE") {
                    window.removeEventListener("message", listener);
                    resolve(event.data.payload);
                }
            };
            window.addEventListener("message", listener);
            window.postMessage({ type: "YT_GET_DATA" }, "*");

            // Timeout fallback
            setTimeout(() => {
                window.removeEventListener("message", listener);
                resolve(null);
            }, 1000);
        });
    }
}

function getPlayerResponse() {
    // Try to get from Main World via DOM if possible, or rely on what's available.
    // Since we are in Isolated World, we can't access window.ytInitialPlayerResponse directly.
    // However, we can try to scrape it from the script tag if it exists in the DOM (sometimes it does).

    // Strategy 1: Look for the script tag (legacy/fallback)
    for (const script of document.querySelectorAll("script")) {
        const match = script.textContent?.match(
            /ytInitialPlayerResponse\s*=\s*({.+?});/
        );
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch (e) {
                continue;
            }
        }
    }

    // Strategy 2: We might have received it via postMessage from our injected script.
    // But this function is synchronous.
    // Ideally, we should have a state store updated by the injected script.

    return null;
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return h > 0
        ? `${h}:${m.toString().padStart(2, "0")}:${s
              .toString()
              .padStart(2, "0")}`
        : `${m}:${s.toString().padStart(2, "0")}`;
}

export default new TranscriptExtractor();
export { TranscriptExtractor };
