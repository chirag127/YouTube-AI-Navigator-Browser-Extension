import { msg } from '../../../utils/shortcuts/runtime.js';

export const name = 'YouTube Direct API';
export const priority = 30;

export const extract = async (vid, lang = 'en') => {
  const r = await msg({ action: 'FETCH_TRANSCRIPT', videoId: vid, lang });
  if (!r.success) throw new Error(r.error || 'YouTube Direct failed');
  return r.data;
};
