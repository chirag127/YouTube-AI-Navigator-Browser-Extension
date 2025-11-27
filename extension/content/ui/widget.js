import { findSecondaryColumn } from "../utils/dom.js";
import { initTabs } from "./tabs.js";
import { attachEventListeners } from "../handlers/events.js";
import { log, logError, waitForElement } from "../core/debug.js";

let widgetContainer = null;

export async function injectWidget() {
    log("Attempting to inject widget...");

    // Remove existing widget
    const existing = document.getElementById("yt-ai-master-widget");
    if (existing) {
        log("Removing existing widget");
        existing.remove();
    }

    // Wait for YouTube's watch page to be ready
    const watchFlexy = document.querySelector('ytd-watch-flexy');
    if (watchFlexy && !watchFlexy.hasAttribute('video-id')) {
        log("Waiting for video to load...");
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Find secondary column with extended selectors
    let secondaryColumn = findSecondaryColumn();
    let attempts = 0;
    const maxAttempts = 15;

    while (!secondaryColumn && attempts < maxAttempts) {
        log(
            `Secondary column not found, waiting... (Attempt ${attempts + 1
            }/${maxAttempts})`
        );
        try {
            // Try multiple selectors for YouTube's various layouts
            secondaryColumn = await waitForElement(
                "#secondary-inner, #secondary, #related, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary",
                800
            );
            if (secondaryColumn) {
                log("Secondary column found after waiting");
                break;
            }
        } catch (error) {
            // Continue waiting
        }
        attempts++;
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!secondaryColumn) {
        logError(
            "Secondary column not found after multiple attempts. Aborting widget injection."
        );
        // Try one more fallback - inject into the page anyway
        secondaryColumn = document.querySelector('#columns') || document.querySelector('ytd-watch-flexy');
        if (!secondaryColumn) {
            return;
        }
        log("Using fallback container for widget injection");
    }

    log("Creating widget element...");
    widgetContainer = document.createElement("div");
    widgetContainer.id = "yt-ai-master-widget";
    widgetContainer.innerHTML = `<div class="yt-ai-header"><div class="yt-ai-title">✨ YouTube AI Master</div><div class="yt-ai-header-actions"><button id="yt-ai-refresh-btn" class="yt-ai-icon-btn" title="Re-analyze">🔄</button><button id="yt-ai-settings-btn" class="yt-ai-icon-btn" title="Settings">⚙️</button></div></div><div class="yt-ai-tabs"><div class="yt-ai-tab active" data-tab="summary">Summary</div><div class="yt-ai-tab" data-tab="transcript">Transcript</div><div class="yt-ai-tab" data-tab="segments">Segments</div><div class="yt-ai-tab" data-tab="chat">Chat</div><div class="yt-ai-tab" data-tab="comments">Comments</div></div><div id="yt-ai-content-area" class="yt-ai-content"><div class="yt-ai-loading"><div class="yt-ai-spinner"></div><div class="yt-ai-loading-text">Initializing...</div></div></div><div id="yt-ai-chat-input-area" class="yt-ai-chat-input" style="display:none;"><input type="text" id="yt-ai-chat-input" placeholder="Ask about this video..."><button id="yt-ai-chat-send">Send</button></div>`;

    log("Inserting widget into DOM...");
    secondaryColumn.insertBefore(widgetContainer, secondaryColumn.firstChild);

    log("Initializing tabs and event listeners...");
    initTabs(widgetContainer);
    attachEventListeners(widgetContainer);

    log("Widget injection complete ✓");
}

export function getWidget() {
    return widgetContainer;
}
