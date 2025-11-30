import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeniusLyricsAPI, geniusLyricsAPI } from '../../extension/api/genius-lyrics.js';

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn(str => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    tf: vi.fn(),
    jf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/string.js', () => ({
    rp: vi.fn((str, regex, repl) => str.replace(regex, repl)),
    trm: vi.fn(str => str.trim()),
}));

vi.mock('../../extension/utils/shortcuts/array.js', () => ({
    am: vi.fn((arr, fn) => arr.map(fn)),
    ajn: vi.fn((arr, sep) => arr.join(sep)),
}));

describe('GeniusLyricsAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new GeniusLyricsAPI();
    });

    describe('getLyrics', () => {
        it('should return lyrics on success', async () => {
            const hit = { result: { url: 'url', title: 'title', primary_artist: { name: 'artist' } } };
            const lyrics = 'lyrics text';
            vi.spyOn(api, 'search').mockResolvedValue(hit);
            vi.spyOn(api, 'fetchLyrics').mockResolvedValue(lyrics);

            const result = await api.getLyrics('title', 'artist');

            expect(result).toEqual({
                lyrics,
                source: 'Genius',
                url: 'url',
                title: 'title',
                artist: 'artist',
            });
        });

        it('should return null on search failure', async () => {
            vi.spyOn(api, 'search').mockResolvedValue(null);

            const result = await api.getLyrics('title', 'artist');

            expect(result).toBeNull();
        });

        it('should return null on fetch failure', async () => {
            const hit = { result: { url: 'url' } };
            vi.spyOn(api, 'search').mockResolvedValue(hit);
            vi.spyOn(api, 'fetchLyrics').mockResolvedValue(null);

            const result = await api.getLyrics('title', 'artist');

            expect(result).toBeNull();
        });

        it('should handle errors', async () => {
            vi.spyOn(api, 'search').mockRejectedValue(new Error('error'));

            const result = await api.getLyrics('title', 'artist');

            expect(result).toBeNull();
        });
    });

    describe('search', () => {
        it('should return hit on success', async () => {
            const data = {
                response: {
                    sections: [
                        {
                            type: 'song',
                            hits: [{ result: { title: 'title' } }],
                        },
                    ],
                },
            };
            const { jf } = await import('../../extension/utils/shortcuts/network.js');
            jf.mockResolvedValue(data);

            const result = await api.search('title', 'artist');

            expect(result).toEqual({ result: { title: 'title' } });
        });

        it('should return null on no sections', async () => {
            const { jf } = await import('../../extension/utils/shortcuts/network.js');
            jf.mockResolvedValue({ response: { sections: [] } });

            const result = await api.search('title', 'artist');

            expect(result).toBeNull();
        });

        it('should return null on no hits', async () => {
            const { jf } = await import('../../extension/utils/shortcuts/network.js');
            jf.mockResolvedValue({
                response: {
                    sections: [{ type: 'song', hits: [] }],
                },
            });

            const result = await api.search('title', 'artist');

            expect(result).toBeNull();
        });
    });

    describe('fetchLyrics', () => {
        it('should extract lyrics from HTML', async () => {
            const html = '<div data-lyrics-container="true">line1<br>line2</div>';
            const { tf } = await import('../../extension/utils/shortcuts/network.js');
            tf.mockResolvedValue(html);

            const result = await api.fetchLyrics('url');

            expect(result).toBe('line1\nline2');
        });

        it('should return null on no HTML', async () => {
            const { tf } = await import('../../extension/utils/shortcuts/network.js');
            tf.mockResolvedValue(null);

            const result = await api.fetchLyrics('url');

            expect(result).toBeNull();
        });

        it('should return null on no lyrics match', async () => {
            const { tf } = await import('../../extension/utils/shortcuts/network.js');
            tf.mockResolvedValue('<div>no lyrics</div>');

            const result = await api.fetchLyrics('url');

            expect(result).toBeNull();
        });
    });

    describe('cleanTitle', () => {
        it('should clean title', () => {
            const { rp, trm } = require('../../extension/utils/shortcuts/string.js');
            rp.mockImplementation((str, regex, repl) => str.replace(regex, repl));
            trm.mockImplementation(str => str.trim());

            const result = api.cleanTitle('Title (Official Video) ft. Artist');

            expect(result).toBe('Title');
        });
    });

    describe('decodeHtml', () => {
        it('should decode entities', () => {
            const result = api.decodeHtml('& < >');

            expect(result).toBe('& < >');
        });
    });

    describe('geniusLyricsAPI instance', () => {
        it('should be an instance of GeniusLyricsAPI', () => {
            expect(geniusLyricsAPI).toBeInstanceOf(GeniusLyricsAPI);
        });
    });
});
