import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';
import { sg } from '../utils/shortcuts/storage.js';

const BASE_URL = 'https://openlibrary.org';

export class OpenLibraryAPI {
  async searchBook(query) {
    const cfg = await sg('integrations');
    if (cfg.integrations?.openlibrary?.enabled === false) return null;

    const url = `https://openlibrary.org/search.json?q=${enc(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.docs?.[0] || null;
  }

  async getWork(key) {
    if (!key) return null;
    return await safeFetch(`${BASE_URL}${key}.json`);
  }
}
