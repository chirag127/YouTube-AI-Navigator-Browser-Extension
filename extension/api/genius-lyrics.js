import { l, e, w } from '../utils/shortcuts/log.js';
import { en as enc } from '../utils/shortcuts/global.js';
import { tf as ftx, jf as fj } from '../utils/shortcuts/network.js';
import { rp, trm } from '../utils/shortcuts/string.js';
import { am, ajn } from '../utils/shortcuts/array.js';

export class GeniusLyricsAPI {
  constructor() {
    this.baseUrl = 'https://genius.com';
    this.searchUrl = 'https://genius.com/api/search/multi';
  }

  async getLyrics(title, artist) {
    l('ENTRY:getLyrics');
    try {
      l(`[Genius] Search: ${title} by ${artist}`);
      const hit = await this.search(title, artist);
      if (!hit) {
        l('[Genius] No song');
        l('EXIT:getLyrics');
        return null;
      }
      l(`[Genius] Hit: ${hit.result.full_title}`);
      const lyrics = await this.fetchLyrics(hit.result.url);
      l('EXIT:getLyrics');
      return {
        lyrics,
        source: 'Genius',
        url: hit.result.url,
        title: hit.result.title,
        artist: hit.result.primary_artist.name,
      };
    } catch (e) {
      e('error:getLyrics fail:', e.message);
      l('EXIT:getLyrics');
      return null;
    }
  }

  async search(title, artist) {
    l('ENTRY:search');
    const cleanTitle = this.cleanTitle(title);
    const query = cleanTitle.includes(artist) ? cleanTitle : `${cleanTitle} ${artist}`;
    const url = `${this.searchUrl}?per_page=1&q=${enc(query)}`;
    const data = await fj(url);
    if (data?.response?.sections) {
      for (const section of data.response.sections) {
        if (section.type === 'song' && section.hits?.length > 0) {
          l('EXIT:search');
          return section.hits[0];
        }
      }
    }
    l('EXIT:search');
    return null;
  }

  async fetchLyrics(url) {
    l('ENTRY:fetchLyrics');
    const html = await ftx(url);
    if (!html) {
      l('EXIT:fetchLyrics');
      return null;
    }
    const lyricsMatch = html.match(/<div[^>]*data-lyrics-container="true"[^>]*>(.*?)<\/div>/gs);
    if (lyricsMatch) {
      l('EXIT:fetchLyrics');
      return trm(
        ajn(
          am(lyricsMatch, div => {
            let text = rp(div, /<br\s*\/?>/gi, '\n');
            text = rp(text, /<[^>]*>/g, '');
            return this.decodeHtml(text);
          }),
          '\n\n'
        )
      );
    }
    l('EXIT:fetchLyrics');
    return null;
  }

  cleanTitle(title) {
    l('ENTRY:cleanTitle');
    l('EXIT:cleanTitle');
    return trm(
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

export const geniusLyricsAPI = new GeniusLyricsAPI();
