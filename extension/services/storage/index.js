import { saveTranscript, getTranscript, deleteTranscript } from './transcript.js'
import { getHistory, updateHistory, deleteFromHistory, searchHistory } from './history.js'
import * as cache from './video-cache.js'

export class StorageService {
    constructor() { this.storage = chrome.storage.local }

    // Legacy methods
    async saveTranscript(v, m, t, s) { const d = await saveTranscript(v, m, t, s); await updateHistory(v, m); return d }
    async getTranscript(v) { return getTranscript(v) }
    async getHistory() { return getHistory() }
    async searchHistory(q) { return searchHistory(q) }
    async deleteVideo(v) { await deleteTranscript(v); await deleteFromHistory(v); await cache.deleteVideoData(v) }

    // New comprehensive cache methods
    async saveVideoData(v, d) { await updateHistory(v, d.metadata || {}); return cache.saveVideoData(v, d) }
    async getVideoData(v) { return cache.getVideoData(v) }
    async hasVideoData(v) { return cache.hasVideoData(v) }

    // Specific data getters
    async getCachedTranscript(v) { return cache.getCachedTranscript(v) }
    async getCachedSummary(v) { return cache.getCachedSummary(v) }
    async getCachedSegments(v) { return cache.getCachedSegments(v) }
    async getCachedComments(v) { return cache.getCachedComments(v) }
    async getCachedChat(v) { return cache.getCachedChat(v) }

    // Specific data savers
    async saveTranscriptCache(v, t) { return cache.saveTranscriptCache(v, t) }
    async saveSummaryCache(v, s, f, i) { return cache.saveSummaryCache(v, s, f, i) }
    async saveSegmentsCache(v, s) { return cache.saveSegmentsCache(v, s) }
    async saveCommentsCache(v, c, cs) { return cache.saveCommentsCache(v, c, cs) }
    async saveChatMessage(v, r, m) { return cache.saveChatMessage(v, r, m) }
    async saveMetadataCache(v, m) { return cache.saveMetadataCache(v, m) }
}
