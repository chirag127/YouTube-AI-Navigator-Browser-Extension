// Unified Video Data Handler
// Centralized handler for all video data requests with caching

import { handleGetTranscript, handleGetVideoInfo, handleGetComments } from './innertube.js';

const CACHE_VERSION = 1;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

async function getCached(videoId, dataType) {
    const key = `video_${videoId}_${dataType}`;
    const result = await chrome.storage.local.get(key);

    if (result[key]) {
        const cached = result[key];
        if (cached.version === CACHE_VERSION && Date.now() - cached.timestamp < CACHE_EXPIRY) {
            console.log(`[VideoData] Cache hit: ${key}`);
            return cached.data;
        }
        await chrome.storage.local.remove(key);
    }
    return null;
}

async function setCache(videoId, dataType, data) {
    const key = `video_${videoId}_${dataType}`;
    await chrome.storage.local.set({
        [key]: {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            data
        }
    });
    console.log(`[VideoData] Cached: ${key}`);
}

export async function handleGetVideoData(request) {
    const { videoId, dataType, options = {} } = request;

    // Check cache first
    const cached = await getCached(videoId, dataType);
    if (cached) {
        return { success: true, data: cached, fromCache: true };
    }

    // Fetch based on type
    let result;
    try {
        switch (dataType) {
            case 'metadata':
                result = await handleGetVideoInfo({ videoId });
                if (result.success) {
                    await setCache(videoId, dataType, result.metadata);
                    return { success: true, data: result.metadata, fromCache: false };
                }
                break;

            case 'transcript':
                result = await handleGetTranscript({ videoId, lang: options.lang || 'en' });
                if (result.success) {
                    await setCache(videoId, dataType, result.segments);
                    return { success: true, data: result.segments, fromCache: false };
                }
                break;

            case 'comments':
                result = await handleGetComments({ videoId, limit: options.limit || 20 });
                if (result.success) {
                    await setCache(videoId, dataType, result.comments);
                    return { success: true, data: result.comments, fromCache: false };
                }
                break;

            default:
                return { success: false, error: 'Invalid data type' };
        }

        return result;
    } catch (error) {
        console.error(`[VideoData] Error fetching ${dataType}:`, error);
        return { success: false, error: error.message };
    }
}
