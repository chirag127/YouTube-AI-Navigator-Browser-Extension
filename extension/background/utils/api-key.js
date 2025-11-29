import { slg } from '../../utils/shortcuts/storage.js';
import { l, e } from '../../utils/shortcuts/logging.js';

export async function getApiKey() {
  l('GetApiKey');
  try {
    const result = await slg('GAK');
    l('GetApiKey:Done');
    return result.GAK || null;
  } catch (err) {
    e('Err:GetApiKey', err);
    return null;
  }
}
