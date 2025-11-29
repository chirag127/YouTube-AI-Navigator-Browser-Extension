import { getHistory } from '../../services/storage/comprehensive-history.js';
import { slg, sls, slr } from '../../utils/shortcuts/storage.js';
import { l, e, w } from '../../utils/shortcuts/logging.js';
import { nw } from '../../utils/shortcuts/core.js';
import { handleGetVideoInfo } from './video-info.js';
import { handleFetchTranscript as handleGetTranscript } from './fetch-transcript.js';
import { handleAnalyzeComments as handleGetComments } from './comments.js';
const CV = 1;
const CE = 864e5;
const getCached = async (vid, type) => {
  const k = `video_${vid}_${type}`;
  const r = await slg(k);
  if (r[k]) {
    const c = r[k];
    if (c.version === CV && nw() - c.timestamp < CE) {
      l(`[VideoData] Cache hit: ${k}`);
      return c.data;
    }
    await slr(k);
  }
  return null;
};
const setCache = async (vid, type, data) => {
  const k = `video_${vid}_${type}`;
  await sls({ [k]: { version: CV, timestamp: nw(), data } });
  l(`[VideoData] Cached: ${k}`);
};
export const handleSaveHistory = async req => {
  const { data } = req;
  const h = getHistory();
  await h.save(data.videoId, data);
  return { success: true };
};
export const handleGetVideoData = async req => {
  const { videoId, dataType, options = {} } = req;
  const c = await getCached(videoId, dataType);
  if (c) return { success: true, data: c, fromCache: true };
  let r;
  try {
    switch (dataType) {
      case 'metadata':
        r = await handleGetVideoInfo({ videoId });
        if (r.success) {
          await setCache(videoId, dataType, r.metadata);
          return { success: true, data: r.metadata, fromCache: false };
        }
        break;
      case 'transcript':
        r = await handleGetTranscript({ videoId, lang: options.lang || 'en' });
        if (r.success) {
          await setCache(videoId, dataType, r.segments);
          return { success: true, data: r.segments, fromCache: false };
        }
        break;
      case 'comments':
        r = await handleGetComments({ videoId, limit: options.limit || 20 });
        if (r.success) {
          await setCache(videoId, dataType, r.comments);
          return { success: true, data: r.comments, fromCache: false };
        }
        break;
      default:
        return { success: false, error: 'Invalid data type' };
    }
    return r;
  } catch (x) {
    e(`[VideoData] Error fetching ${dataType}:`, x);
    return { success: false, error: x.message };
  }
};
