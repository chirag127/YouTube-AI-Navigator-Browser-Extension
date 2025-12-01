import { getHistory } from '../../services/storage/comprehensive-history.js';
import { handleGetVideoInfo } from './video-info.js';
import { handleFetchTranscript as handleGetTranscript } from './fetch-transcript.js';
import { handleAnalyzeComments as handleGetComments } from './comments.js';

const CV = 1;
const CE = 864e5;

const getCached = async (vid, type) => {
  const k = `video_${vid}_${type}`;
  const r = await chrome.storage.local.get(k);
  if (r[k]) {
    const c = r[k];
    if (c.version === CV && Date.now() - c.timestamp < CE) {
      return c.data;
    }
    await chrome.storage.local.remove(k);
  }
  return null;
};

const setCache = async (vid, type, data) => {
  const k = `video_${vid}_${type}`;
  await chrome.storage.local.set({ [k]: { version: CV, timestamp: Date.now(), data } });
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
        r = await new Promise((resolve) => {
          handleGetTranscript({ videoId, lang: options.lang || 'en' }, resolve);
        });
        if (r.success) {
          await setCache(videoId, dataType, r.transcript || r.segments);
          return { success: true, data: r.transcript || r.segments, fromCache: false };
        }
        break;
      case 'comments':
        r = await new Promise((resolve) => {
          handleGetComments({ videoId, limit: options.limit || 20 }, resolve);
        });
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
    console.error(`[VideoData] Error fetching ${dataType}:`, x);
    return { success: false, error: x.message };
  }
};
