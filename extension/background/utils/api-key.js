import { slg } from '../../utils/shortcuts/storage.js';
import { e } from '../../utils/shortcuts/log.js';

export async function getApiKey() {
  try {
    const result = await slg('GAK');

    return result.GAK || null;
  } catch (err) {
    e('Err:GetApiKey', err);
    return null;
  }
}
