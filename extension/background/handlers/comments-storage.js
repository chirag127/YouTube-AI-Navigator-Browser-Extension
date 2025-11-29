import { initializeServices as is, getServices as gs } from '../services.js';
import { getApiKey as gak } from '../utils/api-key.js';
import { log as l } from '../../utils/shortcuts/core.js';

export const handleSaveComments = async (req, rsp) => {
  const k = await gak();
  if (k) await is(k);
  const { storage: s } = gs();
  if (s) {
    l('[Comments] Saving comments...');
    // TODO: Implement comment saving logic
  }
  rsp({ success: true });
};
