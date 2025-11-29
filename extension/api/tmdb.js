import { l } from '../utils/shortcuts/log.js';
import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://api.themoviedb.org/3';

export class TmdbAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async searchMovie(query) {
    if (!this.apiKey) return null;
    l(`[TMDB] Searching: ${query}`);
    const data = await safeFetch(
      `${BASE_URL}/search/movie?api_key=${this.apiKey}&query=${enc(query)}`
    );
    return data?.results?.[0] || null;
  }
  async searchTV(query) {
    if (!this.apiKey) return null;
    l(`[TMDB] Searching TV: ${query}`);
    const data = await safeFetch(
      `${BASE_URL}/search/tv?api_key=${this.apiKey}&query=${enc(query)}`
    );
    return data?.results?.[0] || null;
  }
  async getDetails(id, type = 'movie') {
    if (!this.apiKey || !id) return null;
    return await safeFetch(
      `${BASE_URL}/${type}/${id}?api_key=${this.apiKey}&append_to_response=credits,similar`
    );
  }
}
