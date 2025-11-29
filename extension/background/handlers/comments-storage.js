import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
export async function handleSaveComments(req, rsp) {
  const k = await getApiKey();
  if (k) await initializeServices(k);
  const { storage } = getServices();
  if (storage) {
  }
  rsp({ success: true });
}
