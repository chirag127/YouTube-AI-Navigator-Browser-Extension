import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';
import { sg } from '../utils/shortcuts/storage.js';

const BASE_URL = 'https://www.wikidata.org/w/api.php';

export async function searchWikidata(query) {
  const cfg = await sg('integrations');
  if (cfg.integrations?.wikidata?.enabled === false) return null;

  const url = `${BASE_URL}?action=wbsearchentities&search=${enc(query)}&language=en&format=json&origin=*`;
  const data = await safeFetch(url);
  return data?.search?.[0] || null;
}

export class WikidataAPI {
  async searchEntity(query) {
    // This method is deprecated, use searchWikidata directly
    return searchWikidata(query);
  }
  async getEntityDetails(id) {
    if (!id) return null;
    const url = `${BASE_URL}?action=wbgetentities&ids=${id}&format=json&origin=*`;
    const data = await safeFetch(url);
    return data?.entities?.[id] || null;
  }
}
