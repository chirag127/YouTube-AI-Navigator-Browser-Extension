import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://musicbrainz.org/ws/2';
const UA = 'YouTubeAIMaster/1.0.0 ( contact@example.com )';

export class MusicBrainzAPI {
  async searchArtist(query) {
    const data = await safeFetch(`${BASE_URL}/artist?query=${enc(query)}&fmt=json`, {
      headers: { 'User-Agent': UA },
    });
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
