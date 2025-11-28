import { startAnalysis } from "../core/analyzer.js";
import { state } from "../core/state.js";
import { sendChatMessage } from "./chat.js";
export function attachEventListeners(w) {
    console.log("[Events] Attaching listeners to widget");

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
