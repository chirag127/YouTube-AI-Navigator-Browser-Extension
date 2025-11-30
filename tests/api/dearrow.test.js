import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    fetchBranding,
    getBranding,
    fetchBrandingPrivate,
    getBestTitle,
    getBestThumbnail,
    getThumbnailUrl,
    fetchThumbnail,
    getVideoMetadata,
    deArrowAPI,
} from '../../extension/api/dearrow.js';

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn((fn, delay) => setTimeout(fn, delay)),
    co: vi.fn((id) => clearTimeout(id)),
}));

vi.mock('../../extension/utils/shortcuts/array.js', () => ({
    am: vi.fn((arr, fn) => arr.map(fn)),
    ajn: vi.fn((arr, sep) => arr.join(sep)),
    af: vi.fn((arr) => Array.from(arr)),
}));

vi.mock('../../extension/utils/shortcuts/string.js', () => ({
    trm: vi.fn((str) => str.trim()),
    rp: vi.fn((str, regex, repl) => str.replace(regex, repl)),
    sb: vi.fn((str, start, end) => str.substring(start, end)),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

describe('DeArrow API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
        vi.stubGlobal('crypto', {
            subtle: {
                digest: vi.fn(),
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchBranding', () => {
        it('should return processed branding data on success', async () => {
            const mockData = { titles: [], thumbnails: [] };
            global.fetch.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });

            const result = await fetchBranding('testVid');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://sponsor.ajay.app/api/branding?videoID=testVid&service=YouTube',
                expect.any(Object)
            );
            expect(result).toEqual({
                titles: [],
                thumbnails: [],
                randomTime: null,
                videoDuration: null,
            });
        });

        it('should return null on 404', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
            });

            const result = await fetchBranding('testVid');

            expect(result).toBeNull();
        });

        it('should return null on network failure', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            const result = await fetchBranding('testVid');

            expect(result).toBeNull();
        });

        it('should handle timeout', async () => {
            global.fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

            const result = await fetchBranding('testVid', { timeout: 1 });

            expect(result).toBeNull();
        });
    });

    describe('getBranding', () => {
        it('should return branding data when enabled', async () => {
            const mockData = { titles: [] };
            global.fetch.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { dearrow: { enabled: true } } });

            const result = await getBranding('testVid');

            expect(result).toEqual(mockData);
        });

        it('should return null when disabled', async () => {
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { dearrow: { enabled: false } } });

            const result = await getBranding('testVid');

            expect(result).toBeNull();
        });
    });

    describe('getBestTitle', () => {
        it('should return the best title', () => {
            const bd = {
                titles: [
                    { title: 'Bad Title', votes: -1, locked: false },
                    { title: 'Good Title', votes: 1, locked: false },
                ],
            };

            const result = getBestTitle(bd);

            expect(result).toBe('Good Title');
        });

        it('should return null for empty branding', () => {
            const result = getBestTitle(null);

            expect(result).toBeNull();
        });

        it('should return null for no titles', () => {
            const result = getBestTitle({ titles: [] });

            expect(result).toBeNull();
        });
    });

    describe('getBestThumbnail', () => {
        it('should return the best thumbnail timestamp', () => {
            const bd = {
                thumbnails: [
                    { timestamp: 10, original: true },
                    { timestamp: 20, original: false, votes: 1 },
                ],
            };

            const result = getBestThumbnail(bd);

            expect(result).toBe(20);
        });

        it('should return null for no thumbnails', () => {
            const result = getBestThumbnail({ thumbnails: [] });

            expect(result).toBeNull();
        });
    });

    describe('getThumbnailUrl', () => {
        it('should generate correct URL', () => {
            const result = getThumbnailUrl('vid', 123);

            expect(result).toBe('https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=vid&time=123');
        });
    });

    describe('fetchThumbnail', () => {
        it('should return blob on success', async () => {
            const mockBlob = new Blob();
            global.fetch.mockResolvedValue({
                ok: true,
                status: 200,
                blob: vi.fn().mockResolvedValue(mockBlob),
            });

            const result = await fetchThumbnail('vid', 123);

            expect(result).toEqual(mockBlob);
        });

        it('should return null on 204', async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 204,
                headers: { get: vi.fn().mockReturnValue('reason') },
            });

            const result = await fetchThumbnail('vid', 123);

            expect(result).toBeNull();
        });

        it('should return null on failure', async () => {
            global.fetch.mockRejectedValue(new Error('error'));

            const result = await fetchThumbnail('vid', 123);

            expect(result).toBeNull();
        });
    });

    describe('getVideoMetadata', () => {
        it('should return metadata with DeArrow data', async () => {
            const mockBd = { titles: [{ title: 'Title', votes: 1 }], thumbnails: [] };
            vi.mocked(fetchBrandingPrivate).mockResolvedValue(mockBd);

            const result = await getVideoMetadata('vid');

            expect(result).toEqual({
                videoId: 'vid',
                hasDeArrowData: true,
                title: 'Title',
                thumbnail: null,
                rawData: mockBd,
            });
        });

        it('should return metadata without DeArrow data', async () => {
            vi.mocked(fetchBrandingPrivate).mockResolvedValue(null);

            const result = await getVideoMetadata('vid');

            expect(result).toEqual({
                videoId: 'vid',
                hasDeArrowData: false,
                title: null,
                thumbnail: null,
            });
        });
    });

    describe('deArrowAPI', () => {
        it('should export all functions', () => {
            expect(deArrowAPI.fetchBranding).toBe(fetchBranding);
            expect(deArrowAPI.getBestTitle).toBe(getBestTitle);
            // etc.
        });
    });
});