import geniusAPI from "../../../api/genius-lyrics.js";
import { isMusicVideo } from "../utils/music-classifier.js";

// Genius Lyrics Strategy
// Priority: 3 (Fallback for Music Videos)

async function fetchViaGenius(videoId, lang = "en") {
    // 1. Get video metadata from page
    const title = document
        .querySelector("h1.ytd-watch-metadata")
        ?.textContent?.trim();
    const channel = document
        .querySelector(".ytd-channel-name a")
        ?.textContent?.trim();

    if (!title) {
        console.warn("[Genius Strategy] Could not find video title");
        return null;
    }

    console.log(
        `[Genius Strategy] Checking if music video: "${title}" by ${channel}`
    );

    // 2. Check if it's a music video using Gemini
    const isMusic = await isMusicVideo(title, channel || "");
    if (!isMusic) {
        console.log(
            "[Genius Strategy] Gemini determined this is NOT a music video. Skipping."
        );
        return null;
    }

    console.log(
        "[Genius Strategy] Identified as Music Video. Fetching lyrics..."
    );

    // 3. Fetch lyrics via background script (to avoid CORS)
    const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
            {
                type: "GET_LYRICS",
                title,
                artist: channel || "",
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.warn(
                        "[Genius Strategy] Message error:",
                        chrome.runtime.lastError
                    );
                    resolve(null);
                    return;
                }
                resolve(response?.result);
            }
        );
    });

    if (result && result.lyrics) {
        console.log(`[Genius Strategy] ✅ Found lyrics for: ${result.title}`);

        return [
            {
                start: 0,
                duration: 0,
                text: result.lyrics,
            },
        ];
    }

    return null;
}

export const strategy = {
    name: "Genius Lyrics",
    priority: 3,
    fetch: fetchViaGenius,
};
