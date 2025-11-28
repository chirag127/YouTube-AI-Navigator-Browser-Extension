import { findSecondaryColumn } from "../utils/dom.js";
import { initTabs } from "./tabs.js";
import { attachEventListeners } from "../handlers/events.js";
import { log, logError, waitForElement } from "../core/debug.js";
import { createWidgetHTML } from "./components/widget/structure.js";

let widgetContainer = null;
let resizeObserver = null;
let containerObserver = null;
let positionCheckInterval = null;
let lastKnownContainer = null;

function updateWidgetHeight() {
    if (!widgetContainer) return;

    const player =
        document.querySelector("#movie_player") ||
        document.querySelector(".html5-video-player");
    if (player) {
        const height = player.offsetHeight;
        if (height > 0) {
            widgetContainer.style.maxHeight = `${height}px`;
            widgetContainer.style.height = `${height}px`;
        }
    }
}

function ensureWidgetAtTop(container) {
    if (!widgetContainer) return;

    // If no container provided, try to find it
    if (!container) {
        container = widgetContainer.parentElement;
        if (!container) {
            log("Widget has no parent, attempting re-injection...");
            reattachWidget();
            return;
        }
    }

    // Store last known container
    lastKnownContainer = container;

    // If widget is not the first child, move it
    if (container.firstChild !== widgetContainer) {
        log("Widget displaced, moving to top...");
        container.insertBefore(widgetContainer, container.firstChild);
    }

    // Ensure proper stacking order
    if (!widgetContainer.style.order || widgetContainer.style.order !== "-9999") {
        widgetContainer.style.order = "-9999";
    }
}

function reattachWidget() {
    if (!widgetContainer) return;

    log("Attempting to reattach widget...");
    const secondaryColumn = findSecondaryColumn();

    if (secondaryColumn) {
        secondaryColumn.insertBefore(widgetContainer, secondaryColumn.firstChild);
        lastKnownContainer = secondaryColumn;
        setupObservers(secondaryColumn);
        log("Widget reattached successfully");
    } else {
        logError("Cannot reattach widget: secondary column not found");
    }
}

function startPositionMonitoring() {
    // Clear existing interval
    if (positionCheckInterval) {
        clearInterval(positionCheckInterval);
    }

    // Aggressively check position every 500ms
    positionCheckInterval = setInterval(() => {
        if (!widgetContainer) {
            clearInterval(positionCheckInterval);
            return;
        }

        // Check if widget is still in DOM
        if (!document.contains(widgetContainer)) {
            log("Widget removed from DOM, attempting reattachment...");
            reattachWidget();
            return;
        }

        // Check if widget is at top
        const parent = widgetContainer.parentElement;
        if (parent && parent.firstChild !== widgetContainer) {
            ensureWidgetAtTop(parent);
        }
    }, 500);
}

export async function injectWidget() {
    log("Attempting to inject widget...");

    // 1. Cleanup existing
    const existing = document.getElementById("yt-ai-master-widget");
    if (existing) {
        if (existing.parentElement) {
            // It exists, let's just ensure it's at the top and return
            // But we need to re-attach observers if they were lost
            widgetContainer = existing;
            const container = existing.parentElement;
            lastKnownContainer = container;
            ensureWidgetAtTop(container);
            setupObservers(container);
            startPositionMonitoring();
            return;
        }
        existing.remove();
    }

    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
    if (containerObserver) {
        containerObserver.disconnect();
        containerObserver = null;
    }

    // 2. Find Container
    let secondaryColumn = findSecondaryColumn();
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts

    while (!secondaryColumn && attempts < maxAttempts) {
        if (attempts % 5 === 0)
            log(`Waiting for secondary column... (${attempts}/${maxAttempts})`);

        try {
            secondaryColumn = await waitForElement(
                "#secondary-inner, #secondary, #related, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary",
                500
            );
            if (secondaryColumn) break;
        } catch (e) { }

        attempts++;
        await new Promise((r) => setTimeout(r, 200));
    }

    if (!secondaryColumn) {
        // Fallback to columns if secondary is absolutely missing (rare on watch page)
        secondaryColumn = document.querySelector("#columns");
        if (!secondaryColumn) {
            logError("Target container not found. Widget injection aborted.");
            return;
        }
        log("Using fallback #columns container");
    }

    // 3. Create Widget
    log("Creating widget element...");
    widgetContainer = document.createElement("div");
    widgetContainer.id = "yt-ai-master-widget";
    widgetContainer.style.order = "-9999"; // Ensure it's first in flex layouts
    widgetContainer.innerHTML = createWidgetHTML();

    // 4. Inject at absolute top
    log("Inserting widget into DOM...");
    secondaryColumn.insertBefore(widgetContainer, secondaryColumn.firstChild);
    lastKnownContainer = secondaryColumn;

    // 5. Setup Logic
    setupWidgetLogic(widgetContainer);
    setupObservers(secondaryColumn);
    startPositionMonitoring();

    log("Widget injection complete ✓");
}

function setupWidgetLogic(container) {
    // Close Button
    const closeBtn = container.querySelector("#yt-ai-close-btn");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            log("Closing widget...");
            container.remove();
            if (resizeObserver) resizeObserver.disconnect();
            if (containerObserver) containerObserver.disconnect();
            if (positionCheckInterval) clearInterval(positionCheckInterval);
            widgetContainer = null;
            lastKnownContainer = null;
        });
    }

    // Tabs & Events
    initTabs(container);
    attachEventListeners(container);
}

function setupObservers(container) {
    // 1. Height Sync
    updateWidgetHeight();
    const player =
        document.querySelector("#movie_player") ||
        document.querySelector(".html5-video-player");

    if (resizeObserver) resizeObserver.disconnect();
    if (player) {
        resizeObserver = new ResizeObserver(() => updateWidgetHeight());
        resizeObserver.observe(player);
    }

    // 2. Position Enforcement (Keep at top)
    if (containerObserver) containerObserver.disconnect();
    containerObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                // Check if we are still the first child
                if (container.firstChild !== widgetContainer) {
                    // Avoid infinite loops by checking if we are just being moved
                    const nodes = Array.from(mutation.addedNodes);
                    if (!nodes.includes(widgetContainer)) {
                        ensureWidgetAtTop(container);
                    }
                }
            }
        }
    });

    containerObserver.observe(container, { childList: true });
}

export function getWidget() {
    return widgetContainer;
}
