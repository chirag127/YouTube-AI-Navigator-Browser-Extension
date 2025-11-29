import { safeFetch, cl, enc } from "../utils/shortcuts.js";

const BASE_URL = "https://api.datamuse.com";

export class DatamuseAPI {
    async getRelatedWords(word) {
        cl(`[Datamuse] Getting related words for: ${word}`);
        // 'ml' means "means like" - good for finding synonyms/context
        const data = await safeFetch(`${BASE_URL}/words?ml=${enc(word)}&max=5`);
        return data || [];
    }
}
