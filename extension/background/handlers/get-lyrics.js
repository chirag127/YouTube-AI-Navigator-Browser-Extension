import { geniusLyricsAPI as geniusAPI } from '../../api/genius-lyrics.js';
import { e } from '../../utils/shortcuts/global.js';
export async function handleGetLyrics(req, rsp) {
  try {
    const { title, artist } = req;
    const res = await geniusAPI.getLyrics(title, artist);
    rsp({ success: true, result: res });
  } catch (x) {
    e('[GetLyrics] Error:', x);
    rsp({ success: false, error: x.message });
  }
}
