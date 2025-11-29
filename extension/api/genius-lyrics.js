
import { l, w } from '../utils/shortcuts/log.js';
import { en as enc } from '../utils/shortcuts/global.js';
import { tf as ftx, jf as fj } from '../utils/shortcuts/network.js';
import { rp, tr } from '../utils/shortcuts/string.js';
import { mp, jn } from '../utils/shortcuts/array.js';

export class GeniusLyricsAPI {
  constructor() {
    this.baseUrl = 'https://genius.com';
    this.searchUrl = 'https://genius.com/api/search/multi';
  }

  async getLyrics(title, artist) {
    try {
      l(`[Genius] Search: ${title} by ${artist}`);
      const hit = await this.search(title, artist);
      if (!hit) {
        l('[Genius] No song');
        return null;
      }
      l(`[Genius] Hit: ${hit.result.full_title}`);
      const lyrics = await this.fetchLyrics(hit.result.url);
      return {
        lyrics,
        source: 'Genius',
        url: hit.result.url,
        title: hit.result.title,
        artist: hit.result.primary_artist.name,
      };
    } catch (e) {
      w(`[Genius] Fail: ${e.message}`);
      return null;
    }
  }

  async search(title, artist) {
    const cleanTitle = this.cleanTitle(title);
    const query = `${artist} ${cleanTitle}`;
    const url = `${this.searchUrl}?per_page=1&q=${enc(query)}`;
    const data = await fj(url);
    if (data?.response?.sections) {
      for (const section of data.response.sections) {
        if (section.type === 'song' && section.hits?.length > 0) return section.hits[0];
      }
    }
    return null;
  }

  async fetchLyrics(url) {
    const html = await ftx(url);
    if (!html) return null;
    const lyricsMatch = html.match(/<div[^>]*data-lyrics-container="true"[^>]*>(.*?)<\/div>/gs);
    if (lyricsMatch) {
      return tr(
        jn(
          mp(lyricsMatch, div => {
            let text = rp(div, /<br\s*\/?>/gi, '\n');
            text = rp(text, /<[^>]*>/g, '');
            return this.decodeHtml(text);
          }),
          '\n\n'
        )
      );
    }
    return null;
  }

  cleanTitle(title) {
    return tr(
      rp(
        rp(
          rp(title, /[([](?:official|video|audio|lyric|lyrics|hq|hd|4k|mv|music video)[)\]]/gi, ''),
          /ft\.|feat\.|featuring/gi,
          ''
        ),
        /[([].*?[)\]]/g,
        ''
      )
    );
  }

  decodeHtml(html) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    };
    return rp(html, /&[^;]+;/g, match => entities[match] || match);
  }
}

export default new GeniusLyricsAPI();
