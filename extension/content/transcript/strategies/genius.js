import { $ } from '../../../utils/shortcuts/dom.js';
import { l, w } from '../../../utils/shortcuts/log.js';
import { msg } from '../../../utils/shortcuts/runtime.js';

export const name = 'Genius Lyrics';
export const priority = 20;

export const extract = async () => {
  const title = $('h1.ytd-watch-metadata')?.textContent?.trim();
  const channel = $('.ytd-channel-name a')?.textContent?.trim();
  if (!title) {
    w('[Genius] No title found');
    return null;
  }
  l(`[Genius] Checking: "${title}" by ${channel}`);
  const r = await msg({ type: 'GET_LYRICS', title, artist: channel || '' });
  if (r?.result?.lyrics) {
    l(`[Genius] ✅ Found lyrics`);
    return [{ start: 0, duration: 0, text: r.result.lyrics }];
  }
  throw new Error('Genius failed or not music');
};
