/**
 * Genius Lyrics API / Scraper
 * Fetches lyrics from Genius.com for music videos
 */
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
            console.log(`[Genius] Searching for: ${title} by ${artist}`);
            const hit = await this.search(title, artist);
            if (!hit) {
                console.log("[Genius] No song found");
                return null;
            }

            console.log(`[Genius] Found hit: ${hit.result.full_title}`);
            const lyrics = await this.fetchLyrics(hit.result.url);
            return {
                lyrics,
                source: "Genius",
                url: hit.result.url,
                title: hit.result.title,
                artist: hit.result.primary_artist.name,
            };
        } catch (e) {
            console.warn(`[Genius] Failed to get lyrics: ${e.message}`);
            return null;
        }
    }

    async search(title, artist) {
        // Clean up title (remove (Official Video), etc.)
        const cleanTitle = this.cleanTitle(title);
        const query = `${artist} ${cleanTitle}`;

        const url = `${this.searchUrl}?per_page=1&q=${encodeURIComponent(
            query
        )}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.response?.sections) {
            for (const section of data.response.sections) {
                if (section.type === "song" && section.hits?.length > 0) {
                    return section.hits[0];
                }
            }
        }
        return null;
    }

    async fetchLyrics(url) {
        const response = await fetch(url);
        const html = await response.text();

        // Simple regex-based extraction since we are in SW (no DOMParser for full HTML doc usually reliable without caveats)
        // Or we can use a lightweight parser if available.
        // Genius lyrics are usually in containers with class starting with 'Lyrics__Container'

        // Note: Genius HTML is complex.
        // Strategy: Look for specific markers or use a cleaner approach if possible.
        // The UserScript uses `document.createElement('div')` and assigns innerHTML, then parses.
        // In Service Worker, we don't have `document`. We can use `OffscreenCanvas`? No.
        // We can use `text` manipulation.

        // Regex to extract text from specific divs might be fragile.
        // Let's try to find the JSON data embedded in the page if available, or just regex the lyrics container.

        // Fallback: Extract text between <div data-lyrics-container="true"> and </div>
        // Removing HTML tags.

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
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }
}

export default new GeniusLyricsAPI();
