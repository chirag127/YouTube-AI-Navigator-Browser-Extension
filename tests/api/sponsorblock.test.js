import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSegments, sponsorBlockAPI } from '../../extension/api/sponsorblock.js';

vi.mock('../../extension/utils/shortcuts/chrome.js', () => ({
    cwr: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/array.js', () => ({
    am: vi.fn((arr, fn) => arr.map(fn)),
    ajn: vi.fn((arr, sep) => arr.join(sep)),
    af: vi.fn((arr) => Array.from(arr)),
}));

vi.mock('../../extension/utils/shortcuts/dom.js', () => ({
    ce: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/segments.js', () => ({
    LM: { sponsor: 'Sponsor' },
}));

describe('SponsorBlock API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('crypto', {
            subtle: {
                digest: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchSegments', () => {
        it('should return segments on success', async () => {
            const mockData = [
                {
                    videoID: 'vid',
                    segments: [
                        {
                            segment: [0, 10],
                            category: 'sponsor',
                            UUID: 'uuid',
                            votes: 1,
                            locked: false,
                        },
                    ],
                },
            ];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue(mockData),
            });

            const result = await fetchSegments('vid');

            expect(result).toEqual([
                {
                    start: 0,
                    end: 10,
                    label: 'sponsor',
                    labelFull: 'Sponsor',
                    category: 'sponsor',
                    UUID: 'uuid',
                    votes: 1,
                    locked: false,
                    actionType: 'skip',
                    description: '',
                },
            ]);
        });

        it('should return empty array for 404', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
            });

            const result = await fetchSegments('vid');

            expect(result).toEqual([]);
        });

        it('should return empty array for 429', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 429,
            });

            const result = await fetchSegments('vid');

            expect(result).toEqual([]);
        });

        it('should return empty array for no vid', async () => {
            const result = await fetchSegments('');

            expect(result).toEqual([]);
        });

        it('should return empty array on failure', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('error'));

            const result = await fetchSegments('vid');

            expect(result).toEqual([]);
        });

        it('should return empty array when no matching video', async () => {
            const mockData = [{ videoID: 'other' }];
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            });

            const result = await fetchSegments('vid');

            expect(result).toEqual([]);
        });
    });

    describe('sponsorBlockAPI', () => {
        it('should export fetchSegments', () => {
            expect(sponsorBlockAPI.fetchSegments).toBe(fetchSegments);
        });
    });
});