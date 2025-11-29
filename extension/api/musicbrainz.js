import { safeFetch, cl, enc } from "../utils/shortcuts.js";

const BASE_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "YouTubeAIMaster/1.0.0 ( contact@example.com )"; // Replace with real contact if available

export class MusicBrainzAPI {
    async searchArtist(query) {
        cl(`[MusicBrainz] Searching Artist: ${query}`);
        const data = await safeFetch(
            `${BASE_URL}/artist?query=${enc(query)}&fmt=json`,
            {
                headers: { "User-Agent": USER_AGENT },
            }
        );
        return data?.artists?.[0] || null;
    }

    async searchRelease(query, artist) {
        const q = artist ? `${query} AND artist:${artist}` : query;
        cl(`[MusicBrainz] Searching Release: ${q}`);
        const data = await safeFetch(
            `${BASE_URL}/release?query=${enc(q)}&fmt=json`,
            {
                headers: { "User-Agent": USER_AGENT },
            }
        );
        return data?.releases?.[0] || null;
    }
}
