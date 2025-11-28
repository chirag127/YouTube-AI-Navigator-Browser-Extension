import { cl, ce, cw, jstr } from "../utils/shortcuts.js";

const API_BASE = "https://sponsor.ajay.app/api";

// SponsorBlock category mapping
const CATEGORY_MAP = {
    sponsor: "Sponsor",
    selfpromo: "Self Promotion",
    interaction: "Interaction Reminder",
    intro: "Intermission/Intro",
    outro: "Endcards/Credits",
    preview: "Preview/Recap",
    music_offtopic: "Off-Topic",
    poi_highlight: "Highlight",
    filler: "Filler/Tangent",
    exclusive_access: "Exclusive Access",
};

/**
 * Generate SHA256 hash prefix for privacy
 */
async function _generateHash(videoID) {
    const encoder = new TextEncoder();
    const data = encoder.encode(videoID);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return hashHex.substring(0, 4); // First 4 chars for privacy
}

/**
 * Map category code to readable name
 */
function _mapCategory(code) {
    return CATEGORY_MAP[code] || code;
}

/**
 * Fetch segments from SponsorBlock API
 */
export async function fetchSegments(videoID) {
    if (!videoID) {
        cw("[SponsorBlock] No videoID provided");
        return [];
    }

    try {
        cl(`[SponsorBlock] Fetching segments for: ${videoID}`);
        const hashPrefix = await _generateHash(videoID);
        const url = `${API_BASE}/skipSegments/${hashPrefix}?service=YouTube`;

        cl(`[SponsorBlock] API URL: ${url}`);
        const response = await fetch(url);

        if (response.status === 404) {
            cl("[SponsorBlock] No segments found (404)");
            return [];
        }

        if (response.status === 429) {
            cw("[SponsorBlock] Rate limited (429)");
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        cl(`[SponsorBlock] Raw response:`, jstr(data));

        // Find matching video in response
        const videoData = data.find((v) => v.videoID === videoID);

        if (!videoData || !videoData.segments) {
            cl("[SponsorBlock] No segments for this video");
            return [];
        }

        // Map segments to our format
        const segments = videoData.segments.map((seg) => ({
            start: seg.segment[0],
            end: seg.segment[1],
            category: _mapCategory(seg.category),
            categoryCode: seg.category,
            UUID: seg.UUID,
            votes: seg.votes,
            locked: seg.locked,
            actionType: seg.actionType || "skip",
            description: seg.description || "",
        }));

        cl(`[SponsorBlock] Mapped ${segments.length} segments`);
        return segments;
    } catch (error) {
        ce("[SponsorBlock] Fetch failed:", error.message);
        return []; // Graceful fallback
    }
}

export default { fetchSegments };
