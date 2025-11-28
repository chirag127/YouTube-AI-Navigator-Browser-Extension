/**
 * YouTube Data Extractor
 * Runs in the Main World to access ytInitialPlayerResponse and intercept network requests.
 */
class YouTubeExtractor {
    constructor() {
        this.originalFetch = window.fetch.bind(window);
        this.listeners = new Map();
        this.interceptedUrls = new Set(); // To avoid infinite loops
        this.initInterceptor();
        this.initNavigationListener();

        // Listen for requests from Isolated World
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            if (event.data.type === "YT_GET_DATA") {
                this.emit("data_response", this.getInitialData());
            }
        });

        // Expose for debugging/manual access if needed
        window._ytExtractor = this;

        console.log("[YouTubeExtractor] Initialized in Main World");
    }

    initInterceptor() {
        window.fetch = async (...args) => {
            const [resource, config] = args;
            const url = resource ? resource.toString() : "";

            // Avoid intercepting our own re-fetches
            if (this.interceptedUrls.has(url)) {
                return this.originalFetch(resource, config);
            }

            const response = await this.originalFetch(resource, config);

            // Async processing
            this.processResponse(url, response).catch((err) => {
                console.error(
                    "[YouTubeExtractor] Error processing response:",
                    err
                );
            });

            return response;
        };
    }

    async processResponse(url, response) {
        if (url.includes("/youtubei/v1/player")) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                this.emit("metadata", data);
            } catch (e) {
                /* ignore json parse errors */
            }
        } else if (url.includes("/youtubei/v1/next")) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                this.emit("comments", data);
            } catch (e) {
                /* ignore */
            }
        } else if (
            url.includes("/api/timedtext") ||
            url.includes("/youtubei/v1/get_transcript")
        ) {
            // Found transcript URL!
            // Instead of cloning/reading the original response (which might fail or be empty),
            // we capture the URL and re-fetch it explicitly.
            this.handleTimedTextUrl(url);
        } else if (url.includes("/youtubei/v1/live_chat/get_live_chat")) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                this.emit("live_chat", data);
            } catch (e) {
                /* ignore */
            }
        } else if (url.includes("/youtubei/v1/reel/")) {
            try {
                const clone = response.clone();
                const data = await clone.json();
                this.emit("shorts_data", data);
            } catch (e) {
                /* ignore */
            }
        }
    }

    async handleTimedTextUrl(url) {
        if (this.interceptedUrls.has(url)) return; // Already handling/handled

        console.log("[YouTubeExtractor] Captured transcript URL, re-fetching:", url);
        this.interceptedUrls.add(url);

        try {
            // Perform a clean fetch using the original fetch function
            const response = await this.originalFetch(url);

            // Check if response is ok
            if (!response.ok) {
                console.error("[YouTubeExtractor] Re-fetch failed:", response.status);
                this.interceptedUrls.delete(url); // Allow retry
                return;
            }

            const data = await response.json();

            console.log("[YouTubeExtractor] Successfully re-fetched transcript data");
            this.emit("transcript", data);

            // Remove from set after a while to allow future refreshes if needed,
            // but keep it briefly to avoid immediate duplicate processing
            setTimeout(() => {
                this.interceptedUrls.delete(url);
            }, 10000);

        } catch (error) {
            console.error("[YouTubeExtractor] Error re-fetching transcript:", error);
            this.interceptedUrls.delete(url);
        }
    }

    initNavigationListener() {
        document.addEventListener("yt-navigate-finish", (e) => {
            const videoId =
                e.detail?.response?.playerResponse?.videoDetails?.videoId;
            console.log("[YouTubeExtractor] Navigation finished:", videoId);
            this.emit("navigation", { videoId, detail: e.detail });
        });
    }

    getInitialData() {
        // Try to get from window first
        let playerResponse = window.ytInitialPlayerResponse;

        // If not available, try to get from ytd-app element (Polymer data binding)
        if (!playerResponse) {
            try {
                const app = document.querySelector("ytd-app");
                playerResponse =
                    app?.data?.playerResponse || app?.__data?.playerResponse;
            } catch (e) {
                /* ignore */
            }
        }

        // If still not available, try to scrape from script tags
        if (!playerResponse) {
            try {
                for (const script of document.querySelectorAll("script")) {
                    const text = script.textContent || "";
                    const match = text.match(
                        /ytInitialPlayerResponse\s*=\s*({.+?});/s
                    );
                    if (match) {
                        playerResponse = JSON.parse(match[1]);
                        break;
                    }
                }
            } catch (e) {
                /* ignore */
            }
        }

        // Try to get from ytplayer.config
        if (!playerResponse && window.ytplayer?.config?.args?.player_response) {
            try {
                playerResponse = JSON.parse(
                    window.ytplayer.config.args.player_response
                );
            } catch (e) {
                /* ignore */
            }
        }

        return {
            playerResponse: playerResponse,
            initialData: window.ytInitialData,
            cfg: window.ytcfg?.data_,
        };
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
    }

    emit(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach((cb) => cb(data));
        }
        // Also post to Content Script (Isolated World)
        window.postMessage(
            { type: `YT_${event.toUpperCase()}`, payload: data },
            "*"
        );
    }

    // Helper to manually extract current metadata if needed
    extractMetadata() {
        const playerResponse = window.ytInitialPlayerResponse;
        if (!playerResponse) return null;

        const details = playerResponse.videoDetails;
        const microformat =
            playerResponse.microformat?.playerMicroformatRenderer;

        return {
            title: details?.title,
            videoId: details?.videoId,
            author: details?.author,
            viewCount: details?.viewCount,
            lengthSeconds: details?.lengthSeconds,
            description: details?.shortDescription,
            isLive: details?.isLiveContent,
            keywords: details?.keywords || [],
            channelId: details?.channelId,
            uploadDate: microformat?.uploadDate || "",
        };
    }

    extractShortsMetadata() {
        const activeShort = document.querySelector(
            "ytd-reel-video-renderer[is-active]"
        );
        if (!activeShort) return null;
        // Scrape DOM for Shorts as fallback
        const title = activeShort.querySelector(
            ".ytd-reel-player-header-renderer-title"
        )?.textContent;
        const channel =
            activeShort.querySelector(".ytd-channel-name")?.textContent;
        return { title: title?.trim(), channel: channel?.trim() };
    }
}

// Initialize
new YouTubeExtractor();
