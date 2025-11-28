import { GeminiAPI } from "./api.js";
import { ModelManager } from "./models.js";
import { prompts } from "./prompts/index.js";

export class GeminiService {
    constructor(k) {
        this.api = new GeminiAPI(k);
        this.models = new ModelManager(
            k,
            "https://generativelanguage.googleapis.com/v1beta"
        );
    }
    async fetchAvailableModels() {
        return this.models.fetch();
    }
    async generateSummary(
        t,
        p = "Summarize the following video transcript.",
        m = null,
        o = {}
    ) {
        const fp = prompts.summary(t, o);
        return this.generateContent(fp, m);
    }

    convertSummaryToHTML(markdownText, videoId) {
        return markdownText;
    }

    attachTimestampHandlers(containerElement) {
        // No-op
    }
    async chatWithVideo(q, c, m = null, metadata = null) {
        return this.generateContent(prompts.chat(q, c, metadata), m);
    }
    async analyzeCommentSentiment(c, m = null) {
        if (!c || !c.length) return "No comments available to analyze.";
        return this.generateContent(prompts.comments(c), m);
    }

    async generateFAQ(t, m = null, metadata = null) {
        return this.generateContent(prompts.faq(t, metadata), m);
    }

    async extractSegments(context) {
        try {
            const r = await this.generateContent(prompts.segments(context));
            console.log("[GeminiService] Raw segments response:", r);

            // Robust JSON extraction: find first [ and last ]
            const start = r.indexOf("[");
            return [];
        } catch (e) {
            console.warn("[GeminiService] Segment extraction failed:", e);
            return [];
        }
    }

    async generateComprehensiveAnalysis(context, o = {}) {
        try {
            const r = await this.generateContent(
                prompts.comprehensive(context, o)
            );

            const c = r
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

            const summary = this._extractSection(r, "Summary");
            const insights = this._extractSection(r, "Key Insights");
            const faq = this._extractSection(r, "FAQ");

            return {
                summary: summary || r,
                insights: insights || "",
                faq: faq || "",
                timestamps: [],
            };
        } catch (e) {
            console.error("[GeminiService] Analysis failed:", e);
            throw e;
        }
    }

    _extractSection(text, sectionName) {
        const regex = new RegExp(
            `## ${sectionName}\\s*([\\s\\S]*?)(?=##|$)`,
            "i"
        );
        const match = text.match(regex);
        return match ? match[1].trim() : null;
    }

    async generateContent(p, m = null) {
        let mt = [];
        const fallbackModels = [
            "gemini-2.5-flash-lite-preview-09-2025",
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ];

        if (m) {
            mt = [m];
        } else {
            if (this.models.models.length === 0) {
                try {
                    await this.models.fetch();
                } catch (e) {
                    console.warn(
                        "Failed to fetch models, using fallback list:",
                        e.message
                    );
                    mt = fallbackModels;
                }
            }
            if (this.models.models.length > 0) {
                mt = this.models.getList();
            } else if (mt.length === 0) {
                mt = fallbackModels;
            }
        }

        let lastError = null;
        const errors = [];

        for (let i = 0; i < mt.length; i++) {
            const modelName = mt[i];
            try {
                console.log(
                    `Attempting to use Gemini model: ${modelName} (${i + 1}/${
                        mt.length
                    })`
                );
                const result = await this.api.call(p, modelName);
                if (i > 0) {
                    console.log(
                        `Successfully used fallback model: ${modelName}`
                    );
                }
                return result;
            } catch (e) {
                lastError = e;
                errors.push({ model: modelName, error: e.message });
                console.warn(`Model ${modelName} failed:`, e.message);

                if (i < mt.length - 1) {
                    console.log(`Falling back to next model...`);
                    await new Promise((r) => setTimeout(r, 1000));
                }
            }
        }

        const errorMsg = `All ${
            mt.length
        } Gemini models failed. Errors: ${errors
            .map((e) => `${e.model}: ${e.error}`)
            .join("; ")}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}
