import { initializeServices as is } from '../services.js';
import { getApiKey as gak } from '../utils/api-key.js';

export const handleSaveComments = async (req, rsp) => {
  const k = await gak();
  if (k) await is(k);
  rsp({ success: true });
};
