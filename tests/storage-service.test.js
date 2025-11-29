import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../extension/services/storage/index.js';

vi.mock('../extension/services/storage/transcript.js', () => ({
    saveTranscript: vi.fn().mockResolvedValue({ success: true }),
    getTranscript: vi.fn().mockResolvedValue({ transcript: 'test' }),
    deleteTranscript: vi.fn().mockResolvedValue(true),
}));

vi.mock('../extension/services/storage/history.js', () => ({
    getHistory: vi.fn().mockResolvedValue([]),
    updateHistory: vi.fn().mockResolvedValue(true),
    deleteFromHistory: vi.fn().mockResolvedValue(true),
    searchHistory: vi.fn().mockResolvedValue([]),
}));

vi.mock('../extension/services/storage/video-cache.js', () => ({
    videoCache: {
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(true),
        clear: vi.fn().mockResolvedValue(true),
    },
}));

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
    sl: vi.fn(),
}));

describe('StorageService', () => {
    let service;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new StorageService();
    });

    it('should initialize with storage', () => {
        expect(service.storage).toBeDefined();
    });

    it('should save transcript', async () => {
        const result = await service.saveTranscript('vid1', { title: 'Test' }, [], 'summary');
        expect(result).toEqual({ success: true });
    });

    it('should get transcript', async () => {
        const result = await service.getTranscript('vid1');
        expect(result).toEqual({ transcript: 'test' });
    });

    it('should get history', async () => {
        const result = await service.getHistory();
        expect(result).toEqual([]);
    });

    it('should search history', async () => {
        const result = await service.searchHistory('query');
        expect(result).toEqual([]);
    });

    it('should delete video', async () => {
        await service.deleteVideo('vid1');
        const { videoCache } = await import('../extension/services/storage/video-cache.js');
        expect(videoCache.clear).toHaveBeenCalledWith('vid1');
    });
});
