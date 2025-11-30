import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://newsdata.io/api/1';

export class NewsDataAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchNews(query, language = 'en') {
    if (!this.apiKey) return [];
    try {
      const data = await safeFetch(
        `${BASE_URL}/news?apikey=${this.apiKey}&q=${enc(query)}&language=${language}`
      );
      return data?.results || [];
    } catch (x) {
      import('../utils/shortcuts/log.js').then(({ e }) =>
        e('[NewsData] searchNews fail:', x.message)
      );
      return [];
    }
  }
}
