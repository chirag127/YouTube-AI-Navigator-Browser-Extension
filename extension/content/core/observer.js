import { state, resetState } from "./state.js";
import { injectWidget } from "../ui/widget.js";
import { startAnalysis } from "./analyzer.js";
import { log, logError } from "./debug.js";

let lastUrl = window.location.href;
let debounceTimer = null;

export function initObserver() {
    log("Initializing observer...");

    // Watch for URL changes (YouTube SPA navigation)
    const urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            log("URL changed:", lastUrl);

            // Debounce to avoid multiple triggers
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                checkCurrentPage();
            }, 300);
        }
    });

    // Also listen for YouTube's navigation events
    document.addEventListener("yt-navigate-finish", () => {
        log("YouTube navigation finished");
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            checkCurrentPage();
        }, 500);
    });

    // Watch for DOM changes that indicate page load
    const o = new MutationObserver(() => {
        if (window.location.pathname !== "/watch") return;
        const u = new URLSearchParams(window.location.search),
            v = u.get("v");

        // If video ID changed OR widget is missing, we might need to act
        const widgetExists = document.getElementById("yt-ai-master-widget");

        if ((v && v !== state.currentVideoId) || (v && !widgetExists)) {
            // Debounce to avoid multiple triggers
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                handleNewVideo(v);
            }, 300);
        }
    });

    urlObserver.observe(document.body, { childList: true, subtree: true });
    o.observe(document.body, { childList: true, subtree: true });

    log("Observer started");
    checkCurrentPage();
}

async function handleNewVideo(v) {
    log("New video detected or widget missing:", v);

    // Only reset state if it's actually a new video
    if (v !== state.currentVideoId) {
        state.currentVideoId = v;
        resetState();
    }

    try {
        await injectWidget();
        log("Widget injected successfully");

        // Double-check position after a short delay (YouTube may still be loading)
        setTimeout(() => {
            const widget = document.getElementById("yt-ai-master-widget");
            if (widget && widget.parentElement) {
                const parent = widget.parentElement;
                if (parent.firstChild !== widget) {
                    log("Widget not at top after injection, correcting...");
                    parent.insertBefore(widget, parent.firstChild);
                }
            }
        }, 500);

        if (state.settings.autoAnalyze) {
            setTimeout(() => startAnalysis(), 1500);
        }
    } catch (error) {
        logError("Widget injection failed", error);
    }
}

function checkCurrentPage() {
    log("Checking current page...");

    if (window.location.pathname === "/watch") {
        const u = new URLSearchParams(window.location.search),
            v = u.get("v");
        if (v) {
            const widgetExists = document.getElementById("yt-ai-master-widget");

            if (v === state.currentVideoId && widgetExists) {
                log(
                    "Same video and widget exists, skipping re-initialization:",
                    v
                );
                return;
            }
            log("Video page detected (New ID or Missing Widget):", v);
            handleNewVideo(v);
        } else {
            log("No video ID found in URL");
        }
    } else {
        log("Not on video page:", window.location.pathname);
    }
}
