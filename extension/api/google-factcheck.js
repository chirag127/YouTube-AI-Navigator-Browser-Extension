import { safeFetch, cl, enc } from "../utils/shortcuts.js";

const BASE_URL = "https://factchecktools.googleapis.com/v1alpha1";

export class GoogleFactCheckAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async searchClaims(query) {
        if (!this.apiKey) return null;
        cl(`[FactCheck] Searching: ${query}`);
        const data = await safeFetch(
            `${BASE_URL}/claims:search?key=${this.apiKey}&query=${enc(query)}`
        );
        return data?.claims || [];
    }
}
