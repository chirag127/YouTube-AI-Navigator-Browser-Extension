import geniusAPI from "../../api/genius-lyrics.js";

export async function handleGetLyrics(request, sendResponse) {
    try {
        const { title, artist } = request;
        const result = await geniusAPI.getLyrics(title, artist);
        sendResponse({ success: true, result });
    } catch (error) {
        console.error("[GetLyrics] Error:", error);
        sendResponse({ success: false, error: error.message });
    }
}
