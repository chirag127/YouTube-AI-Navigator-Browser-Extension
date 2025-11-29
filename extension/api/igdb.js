import { safeFetch, cl, cw, ft } from "../utils/shortcuts.js";

// IGDB requires a proxy or server-side component usually because of CORS and Client Secret security.
// However, since we are in a browser extension, we might be able to use the Twitch API directly if we have a token.
// For this "No Credit Card" requirement, we assume the user provides Client ID and Access Token (generated via Twitch dev console).
// NOTE: Direct IGDB calls from browser might be blocked by CORS unless using a proxy.
// We will implement the logic assuming a direct call is possible or a proxy is configured.
// If CORS fails, this will gracefully return null.

const BASE_URL = "https://api.igdb.com/v4";

export class IgdbAPI {
    constructor(clientId, accessToken) {
        this.clientId = clientId;
        this.accessToken = accessToken;
    }

    async searchGame(query) {
        if (!this.clientId || !this.accessToken) return null;
        cl(`[IGDB] Searching: ${query}`);

        // IGDB uses raw body for queries
        const body = `search "${query}"; fields name, summary, rating, first_release_date, platforms.name; limit 1;`;

        try {
            const data = await ft(`${BASE_URL}/games`, {
                method: "POST",
                headers: {
                    "Client-ID": this.clientId,
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "text/plain",
                },
                body: body,
            });
            return data?.[0] || null;
        } catch (e) {
            cw("[IGDB] Request failed (likely CORS or Auth):", e.message);
            return null;
        }
    }
}
