// YouTube Direct API Strategy
// Priority: 1 (Most reliable - Direct timedtext endpoint with full parameters)

import { parseXML } from "../parsers/xml-parser.js";
import { parseJSON3 } from "../parsers/json3-parser.js";

/**
 * Build YouTube timedtext API URL with all required parameters
 * This is the most reliable method as it uses YouTube's official API
 */
function buildTimedTextUrl(videoId, lang = "en", fmt = "json3") {
    const params = new URLSearchParams({
        v: videoId,
        lang: lang,
        fmt: fmt,
        // Additional parameters for reliability
        caps: "asr",
        kind: "asr",
        xoaf: "5",
        xowf: "1",
        hl: lang,
        ip: "0.0.0.0",
        ipbits: "0",
    });

    return `https://www.youtube.com/api/timedtext?${params.toString()}`;
}

export async function fetchViaYouTubeDirect(videoId, lang = "en") {
    // Try to get data from Main World via TranscriptExtractor
    try {
        // Dynamic import to avoid circular dependencies if any
        const { TranscriptExtractor } = await import(
            "../../content/transcript/extractor.js"
        );
        const initialData = await TranscriptExtractor.getInitialData();

        if (
            initialData?.playerResponse?.captions
                ?.playerCaptionsTracklistRenderer?.captionTracks
        ) {
            const tracks =
                initialData.playerResponse.captions
                    .playerCaptionsTracklistRenderer.captionTracks;
            const track =
                tracks.find((t) => t.languageCode === lang) || tracks[0];

            if (track && track.baseUrl) {
                console.log(
                    "[YouTube Direct] Found track in initialData:",
                    track.languageCode
                );
                const url = track.baseUrl + "&fmt=json3";
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    // Parse JSON3 format
                    const { parseJSON3 } = await import(
                        "../parsers/json3-parser.js"
                    );
                    const segments = parseJSON3(data);
                    if (segments.length) return segments;
                }
            }
        }
    } catch (e) {
        console.warn("[YouTube Direct] Failed to use initialData:", e);
    }

    // Try JSON3 first (most reliable and structured format)
    try {
        const url = buildTimedTextUrl(videoId, lang, "json3");
        console.log("[YouTube Direct] Fetching JSON3:", url);

        const res = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json, text/plain, */*",
                "Accept-Language": lang,
            },
            credentials: "omit", // Don't send cookies to avoid auth issues
            cache: "no-cache",
        });

        console.log(
            "[YouTube Direct] Response status:",
            res.status,
            res.statusText
        );
        console.log("[YouTube Direct] Response headers:", {
            contentType: res.headers.get("content-type"),
            contentLength: res.headers.get("content-length"),
        });

        if (res.ok) {
            // Use arrayBuffer then decode to handle large responses better
            const buffer = await res.arrayBuffer();
            const text = new TextDecoder("utf-8").decode(buffer);

            console.log("[YouTube Direct] Response length:", text.length);
            console.log(
                "[YouTube Direct] Response preview:",
                text.substring(0, 100)
            );

            // Validate response is not empty
            if (!text || text.trim().length === 0) {
                throw new Error("Empty response from YouTube API");
            }

            // Try to parse JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.warn(
                    "[YouTube Direct] JSON parse error:",
                    parseError.message
                );
                console.warn(
                    "[YouTube Direct] Response preview:",
                    text.substring(0, 500)
                );
                console.warn(
                    "[YouTube Direct] Response end:",
                    text.substring(text.length - 100)
                );
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }

            const segments = parseJSON3(data);
            if (segments.length) {
                console.log(
                    `[YouTube Direct] ✅ JSON3 format: ${segments.length} segments`
                );
                return segments;
            } else {
                console.warn(
                    "[YouTube Direct] JSON3 parsed but returned 0 segments"
                );
            }
        } else {
            console.warn(
                "[YouTube Direct] HTTP error:",
                res.status,
                res.statusText
            );
        }
    } catch (e) {
        console.warn("[YouTube Direct] JSON3 failed:", e.message, e.stack);
    }

    // Fallback to XML formats
    const xmlFormats = ["srv3", "srv2", "srv1"];
    for (const fmt of xmlFormats) {
        try {
            const url = buildTimedTextUrl(videoId, lang, fmt);
            const res = await fetch(url);

            if (res.ok) {
                const xmlText = await res.text();
                const segments = parseXML(xmlText);
                if (segments.length) {
                    console.log(
                        `[YouTube Direct] ✅ ${fmt} format: ${segments.length} segments`
                    );
                    return segments;
                }
            }
        } catch (e) {
            continue;
        }
    }

    throw new Error("YouTube Direct API failed for all formats");
}

export const strategy = {
    name: "YouTube Direct API",
    priority: 1, // Highest priority - most reliable method
    fetch: fetchViaYouTubeDirect,
};
