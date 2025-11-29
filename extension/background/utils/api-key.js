import { sg, slg } from '../../utils/shortcuts/storage.js';

export async function getApiKey() {
  const s = await sg('apiKey');
  if (s.apiKey) return s.apiKey;
  const l = await slg('geminiApiKey');
  return l.geminiApiKey || null;
}
