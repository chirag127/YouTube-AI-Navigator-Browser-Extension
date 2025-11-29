import { sg as ssg } from '../../utils/shortcuts/storage.js';
import { l, e } from '../../utils/shortcuts/logging.js';
export async function handleGetSettings(rsp) {
  l('GetSettings');
  try {
    const s = await ssg([
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
    l('GetSettings:OK');
    rsp({ success: true, data: s });
    l('GetSettings:Done');
  } catch (x) {
    e('GetSettings:', x);
    rsp({ success: false, error: x.message });
    l('GetSettings:Done');
  }
}
