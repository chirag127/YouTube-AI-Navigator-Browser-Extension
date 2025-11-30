import { w } from '../utils/shortcuts/log.js';
import { ft } from '../utils/shortcuts/network.js';

const BASE_URL = 'https://api.igdb.com/v4';

export class IgdbAPI {
  constructor(clientId, accessToken) {
    this.clientId = clientId;
    this.accessToken = accessToken;
  }

  async searchGame(query) {
    if (!this.clientId || !this.accessToken) return null;
    try {
      const res = await ft(`${BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: `search "${query}"; fields name, cover.url, summary; limit 1;`,
      });
      return res?.[0] || null;
    } catch (x) {
      w('[IGDB] searchGame fail:', x.message);
      return null;
    }
  }
}
