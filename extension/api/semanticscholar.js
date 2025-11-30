import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://api.semanticscholar.org/graph/v1';

export class SemanticScholarAPI {
  async searchPaper(query) {
    try {
      const data = await safeFetch(
        `${BASE_URL}/paper/search?query=${enc(query)}&limit=1&fields=title,authors,year,abstract`
      );
      return data?.data?.[0] || null;
    } catch (x) {
      import('../utils/shortcuts/log.js').then(({ e }) =>
        e('[SemanticScholar] searchPaper fail:', x.message)
      );
      return null;
    }
  }
}
