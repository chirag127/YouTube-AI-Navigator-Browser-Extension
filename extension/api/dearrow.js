// DeArrow API Service
// Fetches community-submitted titles and thumbnails for YouTube videos
// API Docs: https://wiki.sponsor.ajay.app/w/API_Docs/DeArrow

import { cw, st, cst, sbs } from "../utils/shortcuts.js";

const DEARROW_API_BASE = "https://sponsor.ajay.app";
const DEARROW_THUMB_BASE = "https://dearrow-thumb.ajay.app";

/**
 * Fetch DeArrow branding data for a video
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Branding data with titles and thumbnails
 */
export async function fetchBranding(videoId, options = {}) {
    const { returnUserID = false, fetchAll = false, timeout = 5000 } = options;

    const params = new URLSearchParams({
        videoID: videoId,
        service: "YouTube",
    });

    if (returnUserID) params.append("returnUserID", "true");
    if (fetchAll) params.append("fetchAll", "true");

    const url = `${DEARROW_API_BASE}/api/branding?${params.toString()}`;

    try {
        const controller = new AbortController();
        const timeoutId = st(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
            },
        });

        cst(timeoutId);

        if (!response.ok) {
            if (response.status === 404) {
                return null; // No DeArrow data available
            }
            throw new Error(`DeArrow API error: ${response.status}`);
        }

        const data = await response.json();
        return parseBrandingResponse(data);
    } catch (error) {
        if (error.name === "AbortError") {
            cw("[DeArrow] Request timeout");
        } else {
            cw("[DeArrow] Fetch failed:", error.message);
        }
        return null;
    }
}

/**
 * Fetch DeArrow branding using SHA256 hash prefix (more private)
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Branding data
 */
export async function fetchBrandingPrivate(videoId, options = {}) {
    const hashPrefix = await generateSHA256Prefix(videoId);

    const { returnUserID = false, fetchAll = false, timeout = 5000 } = options;

    const params = new URLSearchParams({
        service: "YouTube",
    });

    if (returnUserID) params.append("returnUserID", "true");
    if (fetchAll) params.append("fetchAll", "true");

    const url = `${DEARROW_API_BASE}/api/branding/${hashPrefix}?${params.toString()}`;

    try {
        const controller = new AbortController();
        const timeoutId = st(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: "application/json",
            },
        });

        cst(timeoutId);

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`DeArrow API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract data for our specific video
        if (data[videoId]) {
            return parseBrandingResponse(data[videoId]);
        }

        return null;
    } catch (error) {
        if (error.name === "AbortError") {
            cw("[DeArrow] Request timeout");
        } else {
            cw("[DeArrow] Fetch failed:", error.message);
        }
        return null;
    }
}

/**
 * Get the best title from DeArrow data
 * @param {Object} brandingData - Parsed branding data
 * @returns {string|null} Best title or null
 */
export function getBestTitle(brandingData) {
    if (!brandingData?.titles?.length) {
        return null;
    }

    // Find first trusted title (locked or votes >= 0)
    const trustedTitle = brandingData.titles.find(
        (t) => t.locked || t.votes >= 0
    );

    if (trustedTitle) {
        return cleanTitle(trustedTitle.title);
    }

    // Fallback to first title if no trusted ones
    if (brandingData.titles[0]) {
        return cleanTitle(brandingData.titles[0].title);
    }

    return null;
}

/**
 * Get the best thumbnail timestamp from DeArrow data
 * @param {Object} brandingData - Parsed branding data
 * @returns {number|null} Timestamp in seconds or null
 */
export function getBestThumbnail(brandingData) {
    if (!brandingData?.thumbnails?.length) {
        return null;
    }

    // Find first trusted thumbnail (locked or votes >= 0)
    const trustedThumb = brandingData.thumbnails.find(
        (t) => t.locked || t.votes >= 0
    );

    if (trustedThumb && !trustedThumb.original) {
        return trustedThumb.timestamp;
    }

    // Fallback to first non-original thumbnail
    const firstCustom = brandingData.thumbnails.find((t) => !t.original);
    if (firstCustom) {
        return firstCustom.timestamp;
    }

    return null;
}

/**
 * Generate thumbnail URL from timestamp
 * @param {string} videoId - YouTube video ID
 * @param {number} timestamp - Time in seconds
 * @returns {string} Thumbnail URL
 */
export function getThumbnailUrl(videoId, timestamp) {
    const params = new URLSearchParams({
        videoID: videoId,
        time: timestamp,
    });

    return `${DEARROW_THUMB_BASE}/api/v1/getThumbnail?${params.toString()}`;
}

/**
 * Fetch thumbnail image
 * @param {string} videoId - YouTube video ID
 * @param {number} timestamp - Time in seconds
 * @returns {Promise<Blob|null>} Thumbnail blob or null
 */
export async function fetchThumbnail(videoId, timestamp, timeout = 5000) {
    const url = getThumbnailUrl(videoId, timestamp);

    try {
        const controller = new AbortController();
        const timeoutId = st(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
        });

        cst(timeoutId);

        if (response.status === 204) {
            // No content - failed to generate
            const reason = response.headers.get("X-Failure-Reason");
            cw("[DeArrow] Thumbnail generation failed:", reason);
            return null;
        }

        if (!response.ok) {
            throw new Error(`Thumbnail fetch error: ${response.status}`);
        }

        return await response.blob();
    } catch (error) {
        if (error.name === "AbortError") {
            cw("[DeArrow] Thumbnail request timeout");
        } else {
            cw("[DeArrow] Thumbnail fetch failed:", error.message);
        }
        return null;
    }
}

/**
 * Parse branding response and normalize data
 * @private
 */
function parseBrandingResponse(data) {
    return {
        titles: data.titles || [],
        thumbnails: data.thumbnails || [],
        randomTime: data.randomTime || null,
        videoDuration: data.videoDuration || null,
    };
}

/**
 * Clean title by removing formatting markers
 * @private
 */
function cleanTitle(title) {
    if (!title) return "";

    // Remove > formatting markers used by auto-formatter
    return title.replace(/>\s*/g, "").trim();
}

/**
 * Generate SHA256 hash prefix for privacy
 * @private
 */
async function generateSHA256Prefix(videoId) {
    const encoder = new TextEncoder();
    const data = encoder.encode(videoId);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Return first 4 characters
    return sbs(hashHex, 0, 4);
}

/**
 * Get complete video metadata including DeArrow data
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Options
 * @returns {Promise<Object>} Complete metadata
 */
export async function getVideoMetadata(videoId, options = {}) {
    const { usePrivateAPI = true } = options;

    // Fetch DeArrow data
    const brandingData = usePrivateAPI
        ? await fetchBrandingPrivate(videoId, options)
        : await fetchBranding(videoId, options);

    if (!brandingData) {
        return {
            videoId,
            hasDeArrowData: false,
            title: null,
            thumbnail: null,
        };
    }

    const title = getBestTitle(brandingData);
    const thumbnailTimestamp = getBestThumbnail(brandingData);

    return {
        videoId,
        hasDeArrowData: true,
        title,
        thumbnail: thumbnailTimestamp
            ? {
                  timestamp: thumbnailTimestamp,
                  url: getThumbnailUrl(videoId, thumbnailTimestamp),
              }
            : null,
        rawData: brandingData,
    };
}

export default {
    fetchBranding,
    fetchBrandingPrivate,
    getBestTitle,
    getBestThumbnail,
    getThumbnailUrl,
    fetchThumbnail,
    getVideoMetadata,
};
