import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
export async function handleSaveChatMessage(req, rsp) {
  const { videoId, message } = req;
  const k = await getApiKey();
  if (k) await initializeServices(k);
  const { storage } = getServices();
  if (storage) await storage.saveChatMessage(videoId, message);
  rsp({ success: true });
}
