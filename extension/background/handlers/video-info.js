import { ft } from '../../utils/shortcuts/network.js';
import { l, e } from '../../utils/shortcuts/logging.js';

export async function handleGetVideoInfo({ videoId }) {
  try {
    const u = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const r = await ft(u);
    if (!r.ok) throw new Error('Failed to fetch oEmbed');
    const d = await r.json();
    l('[VideoInfo] Fetched oEmbed:', d.title);
    return {
      success: true,
      metadata: {
        title: d.title,
        author: d.author_name,
        videoId,
        viewCount: 'Unknown', // oEmbed doesn't provide view count
        lengthSeconds: 0, // oEmbed doesn't provide length
      },
    };
  } catch (x) {
    e('[VideoInfo] Error:', x);
    return { success: false, error: x.message };
  }
}
