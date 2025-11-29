const gu = p => chrome.runtime.getURL(p);

const { qs: $ } = await import(gu('utils/shortcuts/dom.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { msg } = await import(gu('utils/shortcuts/runtime.js'));
export const name = 'Genius Lyrics';
export const priority = 20;

export const extract = async () => {
  l('extract:Start');
  try {
    const title = $('h1.ytd-watch-metadata')?.textContent?.trim();
    const channel = $('.ytd-channel-name a')?.textContent?.trim();
    if (!title) {
      l('[Genius] No title found');
      l('extract:End');
      return null;
    }
    l(`[Genius] Checking: "${title}" by ${channel}`);
    const r = await msg({ type: 'GET_LYRICS', title, artist: channel || '' });
    if (r?.result?.lyrics) {
      l(`[Genius] ✅ Found lyrics`);
      l('extract:End');
      return [{ start: 0, duration: 0, text: r.result.lyrics }];
    }
    throw new Error('Genius failed or not music');
  } catch (err) {
    e('Err:extract', err);
    throw err;
  }
};
