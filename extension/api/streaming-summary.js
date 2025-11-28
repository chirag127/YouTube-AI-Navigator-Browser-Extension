import { prompts } from "./prompts.js";
import { GeminiAPI } from "./api.js";

export class StreamingSummaryService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta";
    }

    async generateStreamingSummary(transcript, options, onChunk) {
        console.log("[StreamingSummary] generateStreamingSummary started", { options });
        const prompt = prompts.comprehensive(transcript, options);
        // This actually delegates to the main Gemini service call in `gemini.js` which handles the API call.
        // But `gemini.js` calls `this.streamingSummary.generateStreamingSummary`.
        // This circular dependency logic in `gemini.js` was:
        // `return this.streamingSummary.generateStreamingSummary(transcript, options, onChunk);`
        // So this class MUST perform the API call or `gemini.js` needs to be refactored.
        // Given `gemini.js` has `generateContentStream`, we should probably reuse that if possible,
        // but `GeminiService` passes `onChunk` to `streamingSummary`.

        // Let's implement the streaming call here directly or use a callback to the parent service?
        // To avoid circular deps, we'll instantiate a fresh API client or expect the caller to pass it.
        // Actually, looking at `gemini.js`:
        // `this.streamingSummary = new StreamingSummaryService(k);`
        // It doesn't pass the `GeminiService` instance.

        // We will perform the API call here directly using a lightweight fetch to avoid duplication
        // OR we can import `GeminiAPI` here.

        const api = new GeminiAPI(this.apiKey);

        // We need to pick a model. `gemini.js` handles model fallback.
        // This service seems to duplicate some logic if we do it here.
        // However, to fix the regression, we must make this work.
        // We'll use a default model or the one from options.
        const fallbackModels = [
            "gemini-2.5-flash-lite-preview-09-2025",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ];
        let modelsToTry = [];

        if (options.model) {
            modelsToTry.push(options.model);
        }
        // Add fallbacks, avoiding duplicates
        for (const m of fallbackModels) {
            if (!modelsToTry.includes(m)) {
                modelsToTry.push(m);
            }
        }

        let fullText = "";
        let extractedTimestamps = [];
        let lastError = null;
        let success = false;

        for (let i = 0; i < modelsToTry.length; i++) {
            const currentModel = modelsToTry[i];
            try {
                console.log(
                    `[StreamingSummary] Attempting model: ${currentModel} (${
                        i + 1
                    }/${modelsToTry.length})`
                );

                // Reset for new attempt
                fullText = "";
                extractedTimestamps = [];

                await api.callStream(
                    prompt,
                    currentModel,
                    (chunk, currentFullText) => {
                        fullText = currentFullText;
                        // Parse timestamps on the fly if needed
                        const timestamps = this.extractTimestamps(chunk);
                        if (timestamps.length) {
                            extractedTimestamps.push(...timestamps);
                        }

                        if (onChunk) {
                            onChunk(chunk, fullText, extractedTimestamps);
                        }
                    }
                );

                success = true;
                console.log(
                    `[StreamingSummary] Success with model: ${currentModel}`
                );
                break; // Success!
            } catch (e) {
                lastError = e;
                console.warn(
                    `[StreamingSummary] Model ${currentModel} failed:`,
                    e.message
                );

                if (i < modelsToTry.length - 1) {
                    console.log(
                        `[StreamingSummary] Falling back to next model...`
                    );
                    await new Promise((r) => setTimeout(r, 1000));
                }
            }
        }

        if (!success) {
            console.error("[StreamingSummary] All models failed", lastError);
            throw new Error(
                `All models failed. Last error: ${lastError?.message}`
            );
        }

        // Final parsing for structure (FAQ, Insights)
        const summary = this.extractSection(fullText, "Summary");
        const insights = this.extractSection(fullText, "Key Insights");
        const faq = this.extractSection(fullText, "FAQ");

        console.log("[StreamingSummary] Extraction complete", {
            summaryLength: summary.length,
            insightsLength: insights.length,
            faqLength: faq.length,
            timestampsCount: extractedTimestamps.length
        });

        return {
            summary: summary || fullText, // Fallback to full text if parsing fails
            insights,
            faq,
            timestamps: extractedTimestamps,
        };
    }

    extractTimestamps(text) {
        const regex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                time: match[1],
                seconds: this.parseTime(match[1]),
            });
        }
        return matches;
    }

    parseTime(timeStr) {
        const parts = timeStr.split(":").map(Number);
        if (parts.length === 3)
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return parts[0];
    }

    extractSection(text, sectionName) {
        // Simple regex to extract markdown sections like ## Summary
        const regex = new RegExp(`##\\s*${sectionName}[\\s\\S]*?(?=##|$)`, "i");
        const match = text.match(regex);
        return match
            ? match[0]
                  .replace(new RegExp(`##\\s*${sectionName}`, "i"), "")
                  .trim()
            : "";
    }

    convertToHTMLWithClickableTimestamps(text, videoId) {
        if (!text) return "";
        // Convert markdown to HTML (simple pass)
        let html = text
            // Headers
            .replace(/^### (.*$)/gm, "<h3>$1</h3>")
            .replace(/^## (.*$)/gm, "<h2>$1</h2>")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Lists
            .replace(/^\s*-\s+(.*$)/gm, "<li>$1</li>")
            // Timestamps
            .replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g, (match, time) => {
                const seconds = this.parseTime(time);
                return `<button class="timestamp-link" data-time="${seconds}" onclick="document.querySelector('video').currentTime = ${seconds}">${time}</button>`;
            });

        // Wrap lists
        html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

        return html;
    }

    attachTimestampClickHandlers(container) {
        if (!container) return;
        const links = container.querySelectorAll(".timestamp-link");
        links.forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const time = parseFloat(link.getAttribute("data-time"));
                // Send message to seek
                // We are in background/popup context usually, but if this is used in content script:
                const video = document.querySelector("video");
                if (video) {
                    video.currentTime = time;
                    video.play();
                } else {
                    // If in sidepanel/popup, send message to content script
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        (tabs) => {
                            if (tabs[0]) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: "SEEK_TO",
                                    timestamp: time,
                                });
                            }
                        }
                    );
                }
            });
        });
    }
}
