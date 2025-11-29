// Centralized Video Data Service
// Single entry point for fetching video data (metadata, transcript, comments)

import videoCache from '../cache/video-cache.js';

class VideoDataService {
    constructor() {
        this.pendingRequests = new Map();
    }

    async getMetadata(videoId, options = {}) {
        return this._fetchWithCache(videoId, 'metadata', async () => {
            const response = await chrome.runtime.sendMessage({
                action: 'GET_VIDEO_DATA',
                videoId,
                dataType: 'metadata',
                options
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        });
    }

    async getTranscript(videoId, lang = 'en') {
        return this._fetchWithCache(videoId, 'transcript', async () => {
            const response = await chrome.runtime.sendMessage({
                action: 'GET_VIDEO_DATA',
                videoId,
                dataType: 'transcript',
                options: { lang }
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        });
    }

    async getComments(videoId, limit = 20) {
        return this._fetchWithCache(videoId, 'comments', async () => {
            const response = await chrome.runtime.sendMessage({
                action: 'GET_VIDEO_DATA',
                videoId,
                dataType: 'comments',
                options: { limit }
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        });
    }

    async _fetchWithCache(videoId, dataType, fetchFn) {
        // Check cache first
        const cached = await videoCache.get(videoId, dataType);
        if (cached) return cached;

        // Prevent duplicate requests
        const key = `${videoId}:${dataType}`;
        if (this.pendingRequests.has(key)) {
            console.log(`[VideoDataService] Waiting for pending: ${key}`);
            return this.pendingRequests.get(key);
        }

        // Fetch and cache
        const promise = fetchFn()
            .then(async (data) => {
                await videoCache.set(videoId, dataType, data);
                this.pendingRequests.delete(key);
                return data;
            })
            .catch((error) => {
                this.pendingRequests.delete(key);
                throw error;
            });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    clearCache(videoId) {
        return videoCache.clear(videoId);
    }
}

export default new VideoDataService();
