import { geniusLyricsAPI as geniusAPI } from '../../api/genius-lyrics.js';
import { l, e } from '../../utils/shortcuts/logging.js';
export async function handleGetLyrics(req, rsp) {
  l('GetLyrics');
  try {
    const { title, artist } = req;
    const res = await geniusAPI.getLyrics(title, artist);
    rsp({ success: true, result: res });
    l('GetLyrics:Done');
  } catch (x) {
    e('[GetLyrics] Error:', x);
    rsp({ success: false, error: x.message });
    l('GetLyrics:Done');
  }
}
