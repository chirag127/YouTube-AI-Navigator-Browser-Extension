import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TmdbAPI } from '../../extension/api/tmdb.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

describe('TmdbAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new TmdbAPI('api-key');
    });

    describe('constructor', () => {
        it('should set apiKey', () => {
            expect(api.apiKey).toBe('api-key');
        });
    });

    describe('searchMovie', () => {
        it('should return movie on success', async () => {
            const mockData = { results: [{ title: 'Movie' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchMovie('query');

            expect(sf).toHaveBeenCalledWith(
                'https://api.themoviedb.org/3/search/movie?api_key=api-key&query=query'
            );
            expect(result).toEqual({ title: 'Movie' });
        });

        it('should return null when no apiKey', async () => {
            const noKeyApi = new TmdbAPI();

            const result = await noKeyApi.searchMovie('query');

            expect(result).toBeNull();
        });

        it('should return null on no results', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue({ results: [] });

            const result = await api.searchMovie('query');

            expect(result).toBeNull();
        });

        it('should return null on failure', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockRejectedValue(new Error('error'));

            const result = await api.searchMovie('query');

            expect(result).toBeNull();
        });
    });

    describe('searchTV', () => {
        it('should return TV show on success', async () => {
            const mockData = { results: [{ name: 'Show' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchTV('query');

            expect(result).toEqual({ name: 'Show' });
        });
    });

    describe('getDetails', () => {
        it('should return details on success', async () => {
            const mockData = { title: 'Details' };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.getDetails('id');

            expect(sf).toHaveBeenCalledWith(
                'https://api.themoviedb.org/3/movie/id?api_key=api-key&append_to_response=credits,similar'
            );
            expect(result).toEqual({ title: 'Details' });
        });

        it('should use tv type', async () => {
            const mockData = { name: 'TV Details' };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.getDetails('id', 'tv');

            expect(sf).toHaveBeenCalledWith(
                'https://api.themoviedb.org/3/tv/id?api_key=api-key&append_to_response=credits,similar'
            );
            expect(result).toEqual({ name: 'TV Details' });
        });

        it('should return null for no id', async () => {
            const result = await api.getDetails('');

            expect(result).toBeNull();
        });
    });
});