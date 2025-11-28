import { GeminiClient } from "../../api/gemini-client.js";

/**
 * Handle audio transcription using Gemini API
 * @param {Object} request - Request object containing audioUrl and lang
 * @param {Function} sendResponse - Callback to send response
 */
export async function handleTranscribeAudio(request, sendResponse) {
    try {
        const { audioUrl, lang } = request;

        if (!audioUrl) {
            throw new Error("No audio URL provided");
        }

        // Get settings for API key
        const settings = await chrome.storage.sync.get(["apiKey", "model"]);
        if (!settings.apiKey) {
            throw new Error("Gemini API key not found");
        }

        const model = settings.model || "gemini-1.5-flash";
        const client = new GeminiClient(settings.apiKey);

        console.log("[TranscribeAudio] Fetching audio...", audioUrl);

        // Fetch audio as blob/arraybuffer
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) {
            throw new Error(`Failed to fetch audio: ${audioRes.status}`);
        }

        const arrayBuffer = await audioRes.arrayBuffer();
        const base64Audio = btoa(
            new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
            )
        );

        console.log(
            `[TranscribeAudio] Audio fetched. Size: ${arrayBuffer.byteLength} bytes`
        );

        // Prepare prompt
        const promptText = `
            Transcribe the following audio into a JSON array of segments.
            Language: ${lang || "en"}.
            Format: JSON only. No markdown.
            Structure: [{"start": number (seconds), "text": "string"}]
            If the audio is music or no speech, return [].
        `;

        const parts = [
            {
                inlineData: {
                    mimeType: "audio/mp4", // Assuming mp4/m4a from YouTube
                    data: base64Audio,
                },
            },
            { text: promptText },
        ];

        console.log("[TranscribeAudio] Sending to Gemini...");
        const text = await client.generateContent(parts, model);

        // Parse JSON
        let segments = [];
        try {
            // Clean markdown code blocks if present
            const cleanText = text
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            segments = JSON.parse(cleanText);
        } catch (e) {
            console.warn(
                "[TranscribeAudio] JSON parse failed, trying to extract array",
                e
            );
            const match = text.match(/\[.*\]/s);
            if (match) {
                segments = JSON.parse(match[0]);
            } else {
                throw new Error("Failed to parse transcription response");
            }
        }

        sendResponse({ success: true, segments });
    } catch (error) {
        console.error("[TranscribeAudio] Error:", error);
        sendResponse({ success: false, error: error.message });
    }
}
