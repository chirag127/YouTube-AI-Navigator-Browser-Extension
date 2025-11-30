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

    const body = `search "${query}"; fields name, summary, rating, first_release_date, platforms.name; limit 1;`;
    try {
      const data = await ft(`${BASE_URL}/games`, {
        method: 'POST',
        headers: {
          'Client-ID': this.clientId,
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: body,
      });
      return data?.[0] || null;
    } catch (e) {
      w('[IGDB] Fail:', e.message);
      return null;
    }
  }
}
