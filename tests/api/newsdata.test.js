import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsDataAPI } from '../../extension/api/newsdata.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

describe('NewsDataAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new NewsDataAPI('api-key');
    });

    describe('constructor', () => {
        it('should set apiKey', () => {
            expect(api.apiKey).toBe('api-key');
        });
    });

    describe('searchNews', () => {
        it('should return results on success', async () => {
            const mockData = { results: [{ title: 'News' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchNews('query');

            expect(sf).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/news?apikey=api-key&q=query&language=en'
            );
            expect(result).toEqual([{ title: 'News' }]);
        });

        it('should use custom language', async () => {
            const mockData = { results: [] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            await api.searchNews('query', 'fr');

            expect(sf).toHaveBeenCalledWith(
                'https://newsdata.io/api/1/news?apikey=api-key&q=query&language=fr'
            );
        });

        it('should return empty array when no apiKey', async () => {
            const noKeyApi = new NewsDataAPI();

            const result = await noKeyApi.searchNews('query');

            expect(result).toEqual([]);
        });

        it('should return empty array on failure', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockRejectedValue(new Error('error'));

            const result = await api.searchNews('query');

            expect(result).toEqual([]);
        });

        it('should return empty array when safeFetch returns null', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(null);

            const result = await api.searchNews('query');

            expect(result).toEqual([]);
        });
    });
});