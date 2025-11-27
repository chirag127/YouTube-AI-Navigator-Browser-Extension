/**
 * Video Metadata Extractor
 * Extracts title, description, and other metadata from YouTube pages
 * Priority: DeArrow (community titles) > DOM extraction > ytInitialPlayerResponse > Piped API (last fallback)
 */

import pipedAPI from "../../services/piped/api.js";
import deArrowAPI from "../../services/dearrow/api.js";

class MetadataExtractor {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5min
    }

    log(level, msg) {
        const icons = { info: "ℹ️", success: "✅", warn: "⚠️", error: "❌" };
        const logFn =
            level === "error"
                ? console.error
                : level === "warn"
                ? console.warn
                : console.log;
        logFn(`[MetadataExtractor] ${icons[level]} ${msg}`);
    }

    /**
     * Extract video metadata with DeArrow first, then DOM extraction, Piped API as last fallback
     * @param {string} videoId - The video ID
     * @param {Object} options - Options
     * @param {boolean} options.usePiped - Whether to try Piped API as fallback (default: false)
     * @param {boolean} options.useDeArrow - Whether to try DeArrow for better titles (default: true)
     * @param {boolean} options.usePrivateDeArrow - Use privacy-preserving DeArrow API (default: true)
     * @returns {Promise<Object>} Metadata object with title, description, author, etc.
     */
    async extract(videoId, options = {}) {
        const {
            usePiped = false,
            useDeArrow = true,
            usePrivateDeArrow = true,
        } = options;

        this.log("info", `Extracting metadata for: ${videoId}`);

        // Check cache first
        const cached = this._getCache(videoId);
        if (cached) {
            this.log("success", "Cache hit");
            return cached;
        }

        // Get data from Main World Extractor
        const initialData = await this.getInitialData();
        const playerResponse = initialData?.playerResponse;

        let metadata = null;
        let deArrowData = null;

        // Try DeArrow first for community-submitted better titles
        if (useDeArrow) {
            try {
                this.log("info", "Fetching DeArrow data...");
                deArrowData = await deArrowAPI.getVideoMetadata(videoId, {
                    usePrivateAPI: usePrivateDeArrow,
                });

                if (deArrowData?.hasDeArrowData && deArrowData.title) {
                    this.log(
                        "success",
                        `DeArrow title found: ${deArrowData.title}`
                    );
                }
            } catch (e) {
                this.log("warn", `DeArrow fetch failed: ${e.message}`);
            }
        }

        // Try DOM extraction (fastest and most reliable for other metadata)
        try {
            const originalTitle = this._extractTitle(playerResponse);

            metadata = {
                videoId,
                // Use DeArrow title if available, otherwise use original
                title: deArrowData?.title || originalTitle,
                originalTitle: originalTitle, // Keep original for reference
                deArrowTitle: deArrowData?.title || null,
                hasDeArrowTitle: !!deArrowData?.title,
                description: this._extractDescription(playerResponse),
                author: this._extractAuthor(playerResponse),
                viewCount: this._extractViewCount(playerResponse),
                publishDate: this._extractPublishDate(playerResponse),
                duration: this._extractDuration(playerResponse),
                keywords: this._extractKeywords(playerResponse),
                category: this._extractCategory(playerResponse),
                deArrowThumbnail: deArrowData?.thumbnail || null,
            };

            // If we got good data from DOM, use it
            if (metadata.title && metadata.title !== "Unknown Title") {
                const source = metadata.hasDeArrowTitle
                    ? "DeArrow + DOM"
                    : "DOM";
                this.log(
                    "success",
                    `Metadata extracted from ${source}: ${metadata.title}`
                );
                this._setCache(videoId, metadata);
                return metadata;
            }
        } catch (e) {
            this.log("warn", `DOM extraction failed: ${e.message}`);
        }

        // Fallback to Piped API only if DOM extraction failed or returned poor data
        if (usePiped) {
            try {
                this.log(
                    "info",
                    "Trying Piped API for metadata as last fallback..."
                );
                const pipedData = await pipedAPI.getVideoMetadata(videoId);

                metadata = {
                    videoId,
                    title:
                        deArrowData?.title ||
                        pipedData.title ||
                        "Unknown Title",
                    originalTitle: pipedData.title || "Unknown Title",
                    deArrowTitle: deArrowData?.title || null,
                    hasDeArrowTitle: !!deArrowData?.title,
                    description: pipedData.description || "",
                    author: pipedData.author || "Unknown Channel",
                    viewCount: pipedData.views || "Unknown",
                    publishDate: pipedData.uploadDate || null,
                    duration: pipedData.duration || null,
                    keywords: [], // Piped doesn't provide keywords
                    category: pipedData.category || null,
                    likes: pipedData.likes,
                    dislikes: pipedData.dislikes,
                    uploaderVerified: pipedData.uploaderVerified,
                    thumbnailUrl: pipedData.thumbnailUrl,
                    deArrowThumbnail: deArrowData?.thumbnail || null,
                };

                const source = metadata.hasDeArrowTitle
                    ? "DeArrow + Piped"
                    : "Piped";
                this.log(
                    "success",
                    `Metadata extracted from ${source}: ${metadata.title}`
                );
                this._setCache(videoId, metadata);
                return metadata;
            } catch (e) {
                this.log("warn", `Piped API failed: ${e.message}`);
            }
        }

        // If both failed, return what we have (even if incomplete)
        if (!metadata || !metadata.title) {
            metadata = {
                videoId,
                title: deArrowData?.title || "Unknown Title",
                originalTitle: "Unknown Title",
                deArrowTitle: deArrowData?.title || null,
                hasDeArrowTitle: !!deArrowData?.title,
                description: "",
                author: "Unknown Channel",
                viewCount: "Unknown",
                publishDate: null,
                duration: null,
                keywords: [],
                category: null,
                deArrowThumbnail: deArrowData?.thumbnail || null,
            };
        }

        this.log("success", `Metadata extracted: ${metadata.title}`);
        this._setCache(videoId, metadata);
        return metadata;
    }

    _extractTitle(playerResponse) {
        // Try multiple methods to get the title
        const methods = [
            () =>
                document.querySelector(
                    "h1.ytd-watch-metadata yt-formatted-string"
                )?.textContent,
            () =>
                document.querySelector("h1.title yt-formatted-string")
                    ?.textContent,
            () => document.querySelector('meta[name="title"]')?.content,
            () => document.querySelector('meta[property="og:title"]')?.content,
            () => document.title.replace(" - YouTube", ""),
            () => playerResponse?.videoDetails?.title,
        ];

        for (const method of methods) {
            try {
                const title = method();
                if (title?.trim()) return title.trim();
            } catch (e) {
                continue;
            }
        }

        return "Unknown Title";
    }

    _extractDescription(playerResponse) {
        // Try multiple methods to get the description
        const methods = [
            () => {
                const expandButton = document.querySelector(
                    "tp-yt-paper-button#expand"
                );
                if (expandButton && !expandButton.hasAttribute("hidden")) {
                    expandButton.click();
                }
                return document.querySelector(
                    "ytd-text-inline-expander#description-inline-expander yt-attributed-string"
                )?.textContent;
            },
            () =>
                document.querySelector("#description yt-formatted-string")
                    ?.textContent,
            () => document.querySelector('meta[name="description"]')?.content,
            () =>
                document.querySelector('meta[property="og:description"]')
                    ?.content,
            () => playerResponse?.videoDetails?.shortDescription,
        ];

        for (const method of methods) {
            try {
                const description = method();
                if (description?.trim()) return description.trim();
            } catch (e) {
                continue;
            }
        }

        return "";
    }

    _extractAuthor(playerResponse) {
        const methods = [
            () =>
                document.querySelector(
                    "ytd-channel-name#channel-name yt-formatted-string a"
                )?.textContent,
            () => document.querySelector("#owner-name a")?.textContent,
            () => document.querySelector('link[itemprop="name"]')?.content,
            () => playerResponse?.videoDetails?.author,
        ];

        for (const method of methods) {
            try {
                const author = method();
                if (author?.trim()) return author.trim();
            } catch (e) {
                continue;
            }
        }

        return "Unknown Channel";
    }

    _extractViewCount(playerResponse) {
        const methods = [
            () => {
                const viewText = document.querySelector(
                    "ytd-video-view-count-renderer span.view-count"
                )?.textContent;
                return this._parseViewCount(viewText);
            },
            () => {
                const viewText = document.querySelector(
                    "#info-container #count"
                )?.textContent;
                return this._parseViewCount(viewText);
            },
            () => playerResponse?.videoDetails?.viewCount,
        ];

        for (const method of methods) {
            try {
                const views = method();
                if (views) return views;
            } catch (e) {
                continue;
            }
        }

        return "Unknown";
    }

    _parseViewCount(text) {
        if (!text) return null;
        const match = text.match(/[\d,]+/);
        return match ? match[0].replace(/,/g, "") : null;
    }

    _extractPublishDate(playerResponse) {
        const methods = [
            () =>
                document.querySelector('meta[itemprop="uploadDate"]')?.content,
            () =>
                document.querySelector("#info-strings yt-formatted-string")
                    ?.textContent,
            () =>
                playerResponse?.microformat?.playerMicroformatRenderer
                    ?.publishDate,
        ];

        for (const method of methods) {
            try {
                const date = method();
                if (date) return date;
            } catch (e) {
                continue;
            }
        }

        return null;
    }

    _extractDuration(playerResponse) {
        const methods = [
            () => document.querySelector('meta[itemprop="duration"]')?.content,
            () => {
                const video = document.querySelector("video");
                return video?.duration ? Math.floor(video.duration) : null;
            },
            () => playerResponse?.videoDetails?.lengthSeconds,
        ];

        for (const method of methods) {
            try {
                const duration = method();
                if (duration) return duration;
            } catch (e) {
                continue;
            }
        }

        return null;
    }

    _extractKeywords(playerResponse) {
        const methods = [
            () =>
                document
                    .querySelector('meta[name="keywords"]')
                    ?.content?.split(",")
                    .map((k) => k.trim()),
            () => playerResponse?.videoDetails?.keywords,
        ];

        for (const method of methods) {
            try {
                const keywords = method();
                if (keywords?.length) return keywords;
            } catch (e) {
                continue;
            }
        }

        return [];
    }

    _extractCategory(playerResponse) {
        try {
            return playerResponse?.microformat?.playerMicroformatRenderer
                ?.category;
        } catch (e) {
            return null;
        }
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

    _getCache(videoId) {
        const cached = this.cache.get(videoId);
        return cached && Date.now() - cached.ts < this.cacheTimeout
            ? cached.data
            : null;
    }

    _setCache(videoId, data) {
        this.cache.set(videoId, { data, ts: Date.now() });
    }

    clearCache() {
        this.cache.clear();
        this.log("info", "Cache cleared");
    }
}

export default new MetadataExtractor();
export { MetadataExtractor };
