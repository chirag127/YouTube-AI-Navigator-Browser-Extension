import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicBrainzAPI } from '../../extension/api/musicbrainz.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

describe('MusicBrainzAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new MusicBrainzAPI();
    });

    describe('searchArtist', () => {
        it('should return artist on success', async () => {
            const mockData = { artists: [{ name: 'Artist' }] };
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { musicbrainz: { enabled: true } } });

            const result = await api.searchArtist('query');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://musicbrainz.org/ws/2/artist?query=query&fmt=json',
                { headers: { 'User-Agent': 'YouTubeAI/1.0' } }
            );
            expect(result).toEqual({ name: 'Artist' });
        });

        it('should return null when disabled', async () => {
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { musicbrainz: { enabled: false } } });

            const result = await api.searchArtist('query');

            expect(result).toBeNull();
        });

        it('should return null on no artists', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({ artists: [] }),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { musicbrainz: { enabled: true } } });

            const result = await api.searchArtist('query');

            expect(result).toBeNull();
        });
    });

    describe('searchRelease', () => {
        it('should return release on success', async () => {
            const mockData = { releases: [{ title: 'Release' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchRelease('query', 'artist');

            expect(sf).toHaveBeenCalledWith(
                'https://musicbrainz.org/ws/2/release?query=query%20AND%20artist%3Aartist&fmt=json',
                { headers: { 'User-Agent': 'YouTubeAINavigator/1.0.0 ( contact@example.com )' } }
            );
            expect(result).toEqual({ title: 'Release' });
        });

        it('should search without artist', async () => {
            const mockData = { releases: [{ title: 'Release' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchRelease('query');

            expect(sf).toHaveBeenCalledWith(
                'https://musicbrainz.org/ws/2/release?query=query&fmt=json',
                expect.any(Object)
            );
            expect(result).toEqual({ title: 'Release' });
        });

        it('should return null on no releases', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue({ releases: [] });

            const result = await api.searchRelease('query');

            expect(result).toBeNull();
        });
    });
});