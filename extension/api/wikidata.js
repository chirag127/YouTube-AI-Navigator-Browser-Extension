import { l } from '../utils/shortcuts/log.js';
import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://www.wikidata.org/w/api.php';

export class WikidataAPI {
  async searchEntity(query) {
    l(`[Wikidata] Searching: ${query}`);
    const url = `${BASE_URL}?action=wbsearchentities&search=${enc(
      query
    )}&language=en&format=json&origin=*`;
    const data = await safeFetch(url);
    return data?.search?.[0] || null;
  }
  async getEntityDetails(id) {
    if (!id) return null;
    const url = `${BASE_URL}?action=wbgetentities&ids=${id}&format=json&origin=*`;
    const data = await safeFetch(url);
    return data?.entities?.[id] || null;
  }
}
