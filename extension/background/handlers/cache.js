import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
export async function handleGetCachedData(req, rsp) {
  const { videoId } = req;
  const k = await getApiKey();
  if (k) await initializeServices(k);
  const { storage } = getServices();
  if (!storage) {
    rsp({ success: false });
    return;
  }
  try {
    const d = await storage.getVideoData(videoId);
    rsp({ success: true, data: d });
  } catch (e) {
    rsp({ success: false, error: e.message });
  }
}
