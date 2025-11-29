// Centralized Video Data Cache
// Single source of truth for video metadata, transcripts, and comments

const CACHE_VERSION = 1;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class VideoCache {
    constructor() {
        this.memoryCache = new Map();
    }

    async get(videoId, dataType) {
        // Check memory cache first
        const memKey = `${videoId}:${dataType}`;
        if (this.memoryCache.has(memKey)) {
            const cached = this.memoryCache.get(memKey);
            if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
                console.log(`[VideoCache] Memory hit: ${memKey}`);
                return cached.data;
            }
            this.memoryCache.delete(memKey);
        }

        // Check storage
        const storageKey = `video_${videoId}_${dataType}`;
        const result = await chrome.storage.local.get(storageKey);

        if (result[storageKey]) {
            const cached = result[storageKey];
            if (cached.version === CACHE_VERSION && Date.now() - cached.timestamp < CACHE_EXPIRY) {
                console.log(`[VideoCache] Storage hit: ${storageKey}`);
                this.memoryCache.set(memKey, { data: cached.data, timestamp: cached.timestamp });
                return cached.data;
            }
            // Expired, remove
            await chrome.storage.local.remove(storageKey);
        }

        return null;
    }

    async set(videoId, dataType, data) {
        const memKey = `${videoId}:${dataType}`;
        const storageKey = `video_${videoId}_${dataType}`;
        const timestamp = Date.now();

        // Set in memory
        this.memoryCache.set(memKey, { data, timestamp });

        // Set in storage
        await chrome.storage.local.set({
            [storageKey]: {
                version: CACHE_VERSION,
                timestamp,
                data
            }
        });

        console.log(`[VideoCache] Cached: ${storageKey}`);
    }

    async clear(videoId) {
        if (videoId) {
            // Clear specific video
            const keys = ['metadata', 'transcript', 'comments'];
            for (const type of keys) {
                this.memoryCache.delete(`${videoId}:${type}`);
                await chrome.storage.local.remove(`video_${videoId}_${type}`);
            }
        } else {
            // Clear all
            this.memoryCache.clear();
            const all = await chrome.storage.local.get(null);
            const videoKeys = Object.keys(all).filter(k => k.startsWith('video_'));
            await chrome.storage.local.remove(videoKeys);
        }
    }
}

export default new VideoCache();
