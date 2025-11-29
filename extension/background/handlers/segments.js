import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
export async function handleClassifySegments(req, rsp) {
  const { transcript, settings } = req;
  const k = settings?.apiKey || (await getApiKey());
  if (!k) {
    rsp({ success: false, error: 'API Key not configured' });
    return;
  }
  await initializeServices(k);
  const { segmentClassification } = getServices();
  const s = await segmentClassification.classifyTranscript({ transcript, metadata: {} });
  rsp({ success: true, data: s });
}
