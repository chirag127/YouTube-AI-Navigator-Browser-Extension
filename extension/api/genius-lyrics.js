/**
 * Genius Lyrics API / Scraper
 * Fetches lyrics from Genius.com for music videos
 */
import { cl, cw, enc, ftx, fj, rpa } from "../utils/shortcuts.js";

export class GeniusLyricsAPI {
    constructor() {
        this.baseUrl = "https://genius.com";
        this.searchUrl = "https://genius.com/api/search/multi";
    }

    /**
     * Search for a song and get its lyrics
     * @param {string} title - Video title
     * @param {string} artist - Channel name or artist
     * @returns {Promise<Object|null>} Lyrics data or null
     */
    async getLyrics(title, artist) {
        try {
            cl(`[Genius] Searching for: ${title} by ${artist}`);
            const hit = await this.search(title, artist);
            if (!hit) {
                cl("[Genius] No song found");
                return null;
            }

            cl(`[Genius] Found hit: ${hit.result.full_title}`);
            const lyrics = await this.fetchLyrics(hit.result.url);
            return {
                lyrics,
                source: "Genius",
                url: hit.result.url,
                title: hit.result.title,
                artist: hit.result.primary_artist.name,
            };
        } catch (e) {
            cw(`[Genius] Failed to get lyrics: ${e.message}`);
            return null;
        }
    }

    async search(title, artist) {
        // Clean up title (remove (Official Video), etc.)
        const cleanTitle = this.cleanTitle(title);
        const query = `${artist} ${cleanTitle}`;

        const url = `${this.searchUrl}?per_page=1&q=${enc(query)}`;
        const data = await fj(url);

        if (data?.response?.sections) {
            for (const section of data.response.sections) {
                if (section.type === "song" && section.hits?.length > 0) {
                    return section.hits[0];
                }
            }
        }
        return null;
    }

    async fetchLyrics(url) {
        const html = await ftx(url);
        if (!html) return null;

        const lyricsMatch = html.match(
            /<div[^>]*data-lyrics-container="true"[^>]*>(.*?)<\/div>/gs
        );
        if (lyricsMatch) {
            return lyricsMatch
                .map((div) => {
                    // Replace <br> with newlines
                    let text = div.replace(/<br\s*\/?>/gi, "\n");
                    // Remove other tags
                    text = text.replace(/<[^>]*>/g, "");
                    // Decode entities
                    text = this.decodeHtml(text);
                    return text;
                })
                .join("\n\n")
                .trim();
        }

        return null;
    }

    cleanTitle(title) {
        return title
            .replace(
                /[\(\[](official|video|audio|lyric|lyrics|hq|hd|4k|mv|music video)[\)\]]/gi,
                ""
            )
            .replace(/ft\.|feat\.|featuring/gi, "")
            .replace(/[\(\[].*?[\)\]]/g, "") // Remove anything in brackets if previous didn't catch it? Maybe too aggressive.
            .trim();
    }

    decodeHtml(html) {
        const entities = {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&#39;": "'",
            "&nbsp;": " ",
        };
        return html.replace(/&[^;]+;/g, (match) => entities[match] || match);
    }
}

export default new GeniusLyricsAPI();
