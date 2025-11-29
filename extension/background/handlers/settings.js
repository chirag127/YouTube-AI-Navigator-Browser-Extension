import { sg } from '../../utils/shortcuts-sw.js';
export async function handleGetSettings(rsp) {
  const s = await sg([
    'apiKey',
    'model',
    'summaryLength',
    'outputLanguage',
    'customPrompt',
    'enableSegments',
    'autoSkipSponsors',
    'autoSkipIntros',
    'saveHistory',
  ]);
  rsp({ success: true, data: s });
}
