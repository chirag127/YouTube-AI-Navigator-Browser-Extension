import { en as enc } from '../utils/shortcuts/global.js';
import { sf as safeFetch } from '../utils/shortcuts/network.js';
import { sg } from '../utils/shortcuts/storage.js';

const BASE_URL = 'https://api.open-meteo.com/v1';

export class OpenMeteoAPI {
  async getWeather(lat, lon) {
    if (!lat || !lon) return null;

    const cfg = await sg('integrations');
    if (cfg.integrations?.openmeteo?.enabled === false) return null;

    const url = `${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.current_weather || null;
  }
  async getCoordinates(city) {
    const data = await safeFetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${enc(
        city
      )}&count=1&language=en&format=json`
    );
    return data?.results?.[0] || null;
  }
}
