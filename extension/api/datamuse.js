import { l, e } from '../utils/shortcuts/log.js';
import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://api.datamuse.com';

export class DatamuseAPI {
  async getRelatedWords(word) {
    l('ENTRY:getRelatedWords');
    l(`[Datamuse] Getting related words for: ${word}`);
    const data = await safeFetch(`${BASE_URL}/words?ml=${enc(word)}&max=5`);
    l('EXIT:getRelatedWords');
    return data || [];
  }
}
