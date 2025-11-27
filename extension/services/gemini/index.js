import { GeminiAPI } from './api.js'
import { ModelManager } from './models.js'
import { prompts } from './prompts.js'
import { StreamingSummaryService } from './streaming-summary.js'
export class GeminiService {
    constructor(k) {
        this.api = new GeminiAPI(k);
        this.models = new ModelManager(k, 'https://generativelanguage.googleapis.com/v1beta');
        this.streamingSummary = new StreamingSummaryService(k);
    }
    async fetchAvailableModels() { return this.models.fetch() }
    async generateSummary(t, p = 'Summarize the following video transcript.', m = null, o = {}, onChunk = null) {
        const fp = prompts.summary(t, o);
        return onChunk ? this.generateContentStream(fp, m, onChunk) : this.generateContent(fp, m);
    }

    async generateStreamingSummaryWithTimestamps(transcript, options = {}, onChunk) {
        return this.streamingSummary.generateStreamingSummary(transcript, options, onChunk);
    }

    convertSummaryToHTML(markdownText, videoId) {
        return this.streamingSummary.convertToHTMLWithClickableTimestamps(markdownText, videoId);
    }

    attachTimestampHandlers(containerElement) {
        return this.streamingSummary.attachTimestampClickHandlers(containerElement);
    }
    async chatWithVideo(q, c, m = null) { return this.generateContent(prompts.chat(q, c), m) }
    async analyzeCommentSentiment(c, m = null) { if (!c || !c.length) return 'No comments available to analyze.'; return this.generateContent(prompts.comments(c), m) }
    async generateFAQ(t, m = null) { return this.generateContent(prompts.faq(t), m) }
    async extractSegments(t, m = null) { try { const r = await this.generateContent(prompts.segments(t), m), c = r.replace(/```json/g, '').replace(/```/g, '').trim(); return JSON.parse(c) } catch (e) { return [] } }
    async generateComprehensiveAnalysis(t, o = {}, onChunk = null) {
        try {
            const r = onChunk
                ? await this.generateContentStream(prompts.comprehensive(t, o), null, onChunk)
                : await this.generateContent(prompts.comprehensive(t, o));
            const c = r.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(c);
        } catch (e) {
            const s = await this.generateSummary(t, undefined, null, o, onChunk);
            const f = await this.generateFAQ(t);
            return { summary: s, faq: f, insights: 'Insights generation failed.' };
        }
    }

    async generateContentStream(p, m = null, onChunk) {
        let mt = [];
        const fallbackModels = ['gemini-2.5-flash-lite-preview-09-2025', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];

        if (m) {
            mt = [m];
        } else {
            if (this.models.models.length === 0) {
                try {
                    await this.models.fetch();
                } catch (e) {
                    console.warn('Failed to fetch models, using fallback list:', e.message);
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

        for (let i = 0; i < mt.length; i++) {
            const modelName = mt[i];
            try {
                console.log(`Attempting to use Gemini model (streaming): ${modelName} (${i + 1}/${mt.length})`);
                const result = await this.api.callStream(p, modelName, onChunk);
                if (i > 0) {
                    console.log(`Successfully used fallback model: ${modelName}`);
                }
                return result;
            } catch (e) {
                lastError = e;
                console.warn(`Model ${modelName} failed:`, e.message);

                if (i < mt.length - 1) {
                    console.log(`Falling back to next model...`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        throw new Error(`All ${mt.length} Gemini models failed. Last error: ${lastError?.message}`);
    }
    async generateContent(p, m = null) {
        let mt = [];
        const fallbackModels = ['gemini-2.5-flash-lite-preview-09-2025', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro'];

        if (m) {
            mt = [m];
        } else {
            if (this.models.models.length === 0) {
                try {
                    await this.models.fetch();
                } catch (e) {
                    console.warn('Failed to fetch models, using fallback list:', e.message);
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
                console.log(`Attempting to use Gemini model: ${modelName} (${i + 1}/${mt.length})`);
                const result = await this.api.call(p, modelName);
                if (i > 0) {
                    console.log(`Successfully used fallback model: ${modelName}`);
                }
                return result;
            } catch (e) {
                lastError = e;
                errors.push({ model: modelName, error: e.message });
                console.warn(`Model ${modelName} failed:`, e.message);

                if (i < mt.length - 1) {
                    console.log(`Falling back to next model...`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        const errorMsg = `All ${mt.length} Gemini models failed. Errors: ${errors.map(e => `${e.model}: ${e.error}`).join('; ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}
