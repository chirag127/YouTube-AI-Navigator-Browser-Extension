import { slg } from '../../utils/shortcuts/storage.js';

export async function getApiKey() {
  const l = await slg('geminiApiKey');
  return l.geminiApiKey || null;
}
