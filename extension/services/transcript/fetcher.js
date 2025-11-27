// Transcript Fetcher - Strategy Orchestrator
// Implements priority-based fallback system

import { strategy as youtubeDirectStrategy } from "./strategies/youtube-direct-strategy.js";
import { strategy as xhrStrategy } from "./strategies/xhr-strategy.js";
import { strategy as backgroundProxyStrategy } from "./strategies/background-proxy-strategy.js";
import { strategy as invidiousStrategy } from "./strategies/invidious-strategy.js";
import { strategy as pipedStrategy } from "./strategies/piped-strategy.js";
import { strategy as domStrategy } from "./strategies/dom-strategy.js";

// Prioritize strategies that work from content script context
const STRATEGIES = [
    youtubeDirectStrategy, // Priority 1: Uses ytInitialPlayerResponse caption URLs
    xhrStrategy, // Priority 2: Intercepts live network requests
    backgroundProxyStrategy, // Priority 5: Service worker fallback (can bypass CORS)
    invidiousStrategy, // Priority 3: Third-party API (Enabled)
    // pipedStrategy,          // Priority 4: Third-party API (Disabled)
    domStrategy, // Priority 6: Last resort DOM scraping
].sort((a, b) => a.priority - b.priority);

/**
 * Fetch transcript using priority-based fallback
 * @param {string} videoId - YouTube video ID
 * @param {string} lang - Language code
 * @param {number} timeout - Timeout per strategy (ms)
 * @returns {Promise<Array>} Transcript segments
 */
export async function fetchTranscript(videoId, lang = "en", timeout = 30000) {
    let lastError;

    for (const strategy of STRATEGIES) {
        try {
            console.log(`[Fetcher] Trying ${strategy.name}...`);

            const promise = strategy.fetch(videoId, lang);
            const result = await Promise.race([
                promise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout")), timeout)
                ),
            ]);

            if (result?.length) {
                console.log(
                    `[Fetcher] ✅ ${strategy.name} succeeded: ${result.length} segments`
                );
                return result;
            }
        } catch (e) {
            lastError = e;
            console.warn(`[Fetcher] ${strategy.name} failed:`, e.message);
        }
    }

    throw new Error(
        lastError?.message || "All transcript fetch strategies failed"
    );
}
