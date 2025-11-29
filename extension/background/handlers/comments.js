import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
import { l } from '../../utils/shortcuts/log.js';
import { sl } from '../../utils/shortcuts/array.js';
import { sb as sub } from '../../utils/shortcuts/string.js';
export async function handleAnalyzeComments(req, rsp) {
  const { comments: c } = req;
  l('[AC] Cnt:', c?.length);
  l('[AC] 1st:', c?.[0]);
  l('[AC] Smp:', sl(c, 0, 3));
  const k = await getApiKey();
  if (!k) {
    rsp({ success: false, error: 'API Key not configured' });
    return;
  }
  await initializeServices(k);
  const { gemini: g } = getServices();
  l('[AC] Analyzing...');
  const a = await g.analyzeCommentSentiment(c);
  l('[AC] Res:', sub(a || '', 0, 200));
  rsp({ success: true, analysis: a });
}
