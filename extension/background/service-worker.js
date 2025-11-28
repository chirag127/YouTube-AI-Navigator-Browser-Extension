import { verifySender } from "./security/sender-check.js";
import { validateMessage, sanitizeRequest } from "./security/validator.js";
import { handleGetSettings } from "./handlers/settings.js";
import { handleFetchTranscript } from "./handlers/fetch-transcript.js";
import { handleAnalyzeVideo } from "./handlers/analyze-video.js";
import { handleAnalyzeComments } from "./handlers/comments.js";

import { handleChatWithVideo } from "./handlers/chat.js";
import { handleSaveToHistory } from "./handlers/history.js";
import { handleGetMetadata } from "./handlers/metadata.js";
import {
    handleFetchInvidiousTranscript,
    handleFetchInvidiousMetadata,
} from "./handlers/invidious.js";
import {
    handleFetchPipedMetadata,
    handleFetchPipedTranscript,
} from "./handlers/piped.js";
import { handleGetCachedData } from "./handlers/cache.js";
import { handleSaveChatMessage } from "./handlers/chat-history.js";
import { handleSaveComments } from "./handlers/comments-storage.js";
import { handleTranscribeAudio } from "./handlers/transcribe-audio.js";
import { handleGetLyrics } from "./handlers/get-lyrics.js";

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        console.log("YouTube AI Master installed");
        chrome.runtime.openOptionsPage();
    } else if (details.reason === "update") {
        console.log(
            "YouTube AI Master updated to version",
            chrome.runtime.getManifest().version
        );
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!verifySender(sender)) {
        sendResponse({ success: false, error: "Unauthorized" });
        return false;
    }

    const validation = validateMessage(request);
    if (!validation.valid) {
        sendResponse({ success: false, error: validation.error });
        return false;
    }

    const sanitized = sanitizeRequest(request);
    const action = sanitized.action || sanitized.type;
    console.log("Background received message:", action);

    (async () => {
        try {
            switch (action) {
                case "TEST":
                    sendResponse({
                        success: true,
                        message: "Background script is running",
                    });
                    break;
                case "GET_SETTINGS":
                    await handleGetSettings(sendResponse);
                    break;
                case "FETCH_TRANSCRIPT":
                    await handleFetchTranscript(sanitized, sendResponse);
                    break;
                case "ANALYZE_VIDEO":
                    await handleAnalyzeVideo(sanitized, sendResponse);
                    break;
                case "ANALYZE_COMMENTS":
                    await handleAnalyzeComments(sanitized, sendResponse);
                    break;

                case "CHAT_WITH_VIDEO":
                    await handleChatWithVideo(sanitized, sendResponse);
                    break;
                case "SAVE_TO_HISTORY":
                    await handleSaveToHistory(sanitized, sendResponse);
                    break;
                case "GET_METADATA":
                    await handleGetMetadata(sanitized, sendResponse);
                    break;
                case "FETCH_INVIDIOUS_TRANSCRIPT":
                    sendResponse(
                        await handleFetchInvidiousTranscript(sanitized)
                    );
                    break;
                case "FETCH_INVIDIOUS_METADATA":
                    sendResponse(await handleFetchInvidiousMetadata(sanitized));
                    break;
                case "FETCH_PIPED_METADATA":
                    sendResponse(await handleFetchPipedMetadata(sanitized));
                    break;
                case "FETCH_PIPED_TRANSCRIPT":
                    sendResponse(await handleFetchPipedTranscript(sanitized));
                    break;
                case "GET_CACHED_DATA":
                    await handleGetCachedData(sanitized, sendResponse);
                    break;
                case "SAVE_CHAT_MESSAGE":
                    await handleSaveChatMessage(sanitized, sendResponse);
                    break;
                case "SAVE_COMMENTS":
                    await handleSaveComments(sanitized, sendResponse);
                    break;
                case "TRANSCRIBE_AUDIO":
                    await handleTranscribeAudio(sanitized, sendResponse);
                    break;
                case "GET_LYRICS":
                    await handleGetLyrics(sanitized, sendResponse);
                    break;
                case "OPEN_OPTIONS":
                    chrome.runtime.openOptionsPage();
                    sendResponse({ success: true });
                    break;
                default:
                    console.warn("Unknown message type:", action);
                    sendResponse({
                        success: false,
                        error: "Unknown message type",
                    });
            }
        } catch (error) {
            console.error("Background handler error:", error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    return true;
});
