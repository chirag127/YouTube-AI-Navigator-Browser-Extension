import { state } from "../core/state.js";
import { renderSummary } from "./renderers/summary.js";
import { renderTranscript } from "./renderers/transcript.js";
import { renderSegments } from "./renderers/segments.js";
import { renderChat } from "./renderers/chat.js";
import { renderComments } from "./renderers/comments.js";
export function initTabs(c) {
    c.querySelectorAll(".yt-ai-tab").forEach((t) =>
        t.addEventListener("click", () => switchTab(t.dataset.tab, c))
    );
}
export function switchTab(n, container) {
    const c = container || document.getElementById("yt-ai-master-widget");
    if (!c) return;

    c.querySelectorAll(".yt-ai-tab").forEach((t) =>
        t.classList.remove("active")
    );
    c.querySelector(`[data-tab="${n}"]`)?.classList.add("active");

    const i = c.querySelector("#yt-ai-chat-input-area");
    if (i) i.style.display = n === "chat" ? "flex" : "none";

    const a = c.querySelector("#yt-ai-content-area");
    if (!a) return;

    try {
        switch (n) {
            case "summary":
                renderSummary(a, state.analysisData || {});
                break;
            case "transcript":
                renderTranscript(a, state.currentTranscript || []);
                break;
            case "segments":
                renderSegments(a, state.analysisData?.segments || []);
                break;
            case "chat":
                renderChat(a);
                break;
            case "comments":
                renderComments(a);
                break;
        }
    } catch (e) {
        console.error("Error switching tab:", e);
        a.innerHTML = `<div class="yt-ai-error">Error loading tab content</div>`;
    }
}
