import { startAnalysis } from "../core/analyzer.js";
import { state } from "../core/state.js";
import { sendChatMessage } from "./chat.js";
export function attachEventListeners(w) {
    console.log("[Events] Attaching listeners to widget");
    const r = w.querySelector("#yt-ai-refresh-btn");
    if (r) {
        r.addEventListener("click", () => {
            console.log("[Events] Refresh clicked");
            if (!state.isAnalyzing) startAnalysis();
        });
    } else {
        console.warn("[Events] Refresh button not found");
    }

    const s = w.querySelector("#yt-ai-settings-btn");
    if (s) {
        s.addEventListener("click", () => {
            console.log("[Events] Settings clicked");
            chrome.runtime.sendMessage({ action: "OPEN_OPTIONS" });
        });
    } else {
        console.warn("[Events] Settings button not found");
    }

    const c = w.querySelector("#yt-ai-chat-send");
    if (c)
        c.addEventListener("click", () => {
            console.log("[Events] Chat send clicked");
            sendChatMessage();
        });

    const i = w.querySelector("#yt-ai-chat-input");
    if (i)
        i.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendChatMessage();
        });
}
