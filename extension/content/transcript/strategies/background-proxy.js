import { msg } from '../../../utils/shortcuts/runtime.js';

export const name = 'Background Proxy';
export const priority = 40;

export const extract = async (vid, lang = 'en') => {
  const r = await msg({ action: 'FETCH_TRANSCRIPT', videoId: vid, lang, useProxy: true });
  if (!r.success) throw new Error(r.error || 'Proxy failed');
  return r.data;
};
