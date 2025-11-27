import { state } from "../core/state.js";
import { getVideoElement } from "../utils/dom.js";

let activeSegments = []; // Segments to monitor
let autoSkipEnabled = false;
let originalPlaybackRate = 1;
let isSpeedingUp = false;

export async function setupAutoSkip(segments) {
    if (!segments?.length) return;

    // Refresh settings from storage to ensure we have latest config
    const stored = await chrome.storage.sync.get(null);
    const settings = stored.segments || {};
    const masterEnabled = stored.enableSegments !== false; // Default true

    if (!masterEnabled) {
        disableAutoSkip();
        return;
    }

    // Filter segments that have an action other than 'ignore'
    activeSegments = segments
        .filter((s) => {
            const config = settings[s.label];
            return config && config.action && config.action !== "ignore";
        })
        .map((s) => ({
            ...s,
            config: settings[s.label],
        }));

    if (activeSegments.length > 0) {
        autoSkipEnabled = true;
        const v = getVideoElement();
        if (v) {
            v.removeEventListener("timeupdate", handleAutoSkip);
            v.addEventListener("timeupdate", handleAutoSkip);
            // Capture original rate initially
            originalPlaybackRate = v.playbackRate;
        }
    } else {
        disableAutoSkip();
    }
}

function disableAutoSkip() {
    autoSkipEnabled = false;
    const v = getVideoElement();
    if (v) {
        v.removeEventListener("timeupdate", handleAutoSkip);
        // Ensure we reset speed if we were speeding
        if (isSpeedingUp) {
            v.playbackRate = originalPlaybackRate;
            isSpeedingUp = false;
        }
    }
}

export function handleAutoSkip() {
    if (!autoSkipEnabled || !activeSegments.length) return;
    const v = getVideoElement();
    if (!v) return;

    const t = v.currentTime;
    let inSpeedSegment = false;

    for (const s of activeSegments) {
        // Check if we are inside a segment
        if (t >= s.start && t < s.end) {
            if (s.config.action === "skip") {
                // SKIP ACTION
                // Add small buffer to avoid loops
                v.currentTime = s.end + 0.1;
                showNotification(`⏭️ Skipped: ${s.label}`);
                return; // Done for this tick
            } else if (s.config.action === "speed") {
                // SPEED ACTION
                inSpeedSegment = true;
                if (!isSpeedingUp) {
                    // Start Speeding
                    originalPlaybackRate = v.playbackRate; // Save current user rate
                    v.playbackRate = s.config.speed || 2;
                    isSpeedingUp = true;
                    showNotification(
                        `⏩ Speeding up: ${s.label} (${s.config.speed}x)`
                    );
                }
                // If already speeding, ensure rate is correct (in case user changed it manually, force it back? or let user override?)
                // Let's enforce it for now
                if (v.playbackRate !== s.config.speed) {
                    v.playbackRate = s.config.speed;
                }
            }
        }
    }

    // If we were speeding but are no longer in a speed segment, restore rate
    if (isSpeedingUp && !inSpeedSegment) {
        v.playbackRate = originalPlaybackRate;
        isSpeedingUp = false;
        // showNotification('▶️ Speed restored') // Optional
    }
}

function showNotification(text) {
    const id = "yt-ai-skip-notif";
    let n = document.getElementById(id);
    if (n) n.remove();

    n = document.createElement("div");
    n.id = id;
    n.style.cssText =
        "position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:10px 20px;border-radius:20px;font-size:14px;z-index:9999;pointer-events:none;font-family:sans-serif;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);";
    n.textContent = text;

    // Animation
    n.animate(
        [
            { opacity: 0, transform: "translate(-50%, 20px)" },
            { opacity: 1, transform: "translate(-50%, 0)" },
            { opacity: 1, offset: 0.8 },
            { opacity: 0, transform: "translate(-50%, -20px)" },
        ],
        {
            duration: 2000,
            easing: "ease-out",
            fill: "forwards",
        }
    );

    document.body.appendChild(n);
    setTimeout(() => {
        if (n.parentNode) n.remove();
    }, 2000);
}
