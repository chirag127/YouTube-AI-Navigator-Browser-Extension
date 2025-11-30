import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://factchecktools.googleapis.com/v1alpha1';

export class GoogleFactCheckAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchClaims(query) {
    if (!this.apiKey) return [];
    try {
      const data = await safeFetch(
        `${BASE_URL}/claims:search?key=${this.apiKey}&query=${enc(query)}`
      );
      return data?.claims || [];
    } catch (x) {
      import('../utils/shortcuts/log.js').then(({ e }) =>
        e('[GoogleFactCheck] searchClaims fail:', x.message)
      );
      return [];
    }
  }
}
