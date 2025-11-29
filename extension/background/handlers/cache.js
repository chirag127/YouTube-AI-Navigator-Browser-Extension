import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
import { l, e } from '../../utils/shortcuts/log.js';
export async function handleGetCachedData(req, rsp) {
  l('GetCached');
  try {
    const { videoId } = req;
    const k = await getApiKey();
    if (k) await initializeServices(k);
    const { storage } = getServices();
    if (!storage) {
      l('GetCached:NS');
      rsp({ success: false });
      return;
    }
    const d = await storage.getVideoData(videoId);
    l('GetCached:OK');
    rsp({ success: true, data: d });
  } catch (x) {
    e('GetCached:', x);
    rsp({ success: false, error: x.message });
  }
}
