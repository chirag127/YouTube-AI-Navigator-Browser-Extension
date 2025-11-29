import { cw, fj } from "../utils/shortcuts.js";

export class ModelManager {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.models = [];
    }

    async fetch() {
        if (!this.apiKey) return;
        try {
            const data = await fj(`${this.baseUrl}/models?key=${this.apiKey}`);
            if (data?.models) {
                this.models = data.models
                    .filter((m) =>
                        m.supportedGenerationMethods?.includes(
                            "generateContent"
                        )
                    )
                    .map((m) => m.name.replace("models/", ""));
            }
        } catch (e) {
            cw("Failed to fetch Gemini models:", e);
            this.models = [];
        }
        return this.models;
    }

    getList() {
        // Prioritize specific models if available
        const priority = [
            "gemini-2.5-flash-lite-preview-09-2025",
            "gemini-2.0-flash-exp",
            "gemini-2.5-flash-preview-09-2025",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro-latest",
            "gemini-1.5-pro-002",
            "gemini-1.5-pro-001",
        ];

        const sorted = [...this.models].sort((a, b) => {
            const indexA = priority.indexOf(a);
            const indexB = priority.indexOf(b);
            if (indexA > -1 && indexB > -1) return indexA - indexB;
            if (indexA > -1) return -1;
            if (indexB > -1) return 1;
            return a.localeCompare(b);
        });

        return sorted.length ? sorted : priority;
    }
}
