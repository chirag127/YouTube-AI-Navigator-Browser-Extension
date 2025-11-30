import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';
import { sg } from '../utils/shortcuts/storage.js';

const BASE_URL = 'https://musicbrainz.org/ws/2';
const UA = 'YouTubeAIMaster/1.0.0 ( contact@example.com )';

export class MusicBrainzAPI {
  async searchArtist(query) {
    const cfg = await sg('integrations');
    if (cfg.integrations?.musicbrainz?.enabled === false) return null;

    const url = `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(query)}&fmt=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'YouTubeAI/1.0' } });
    const data = await res.json();
    return data?.artists?.[0] || null;
  }
  async searchRelease(query, artist) {
    const q = artist ? `${query} AND artist:${artist}` : query;

    const data = await safeFetch(`${BASE_URL}/release?query=${enc(q)}&fmt=json`, {
      headers: { 'User-Agent': UA },
    });
    return data?.releases?.[0] || null;
  }
}
