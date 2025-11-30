import { describe, it, expect, vi } from 'vitest';
import { DatamuseAPI } from '../../extension/api/datamuse.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((word) => encodeURIComponent(word)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

describe('DatamuseAPI', () => {
    let api;

    beforeEach(() => {
        api = new DatamuseAPI();
        vi.clearAllMocks();
    });

    describe('getRelatedWords', () => {
        it('should return related words on success', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue([{ word: 'test' }]);

            const result = await api.getRelatedWords('test');

            expect(sf).toHaveBeenCalledWith('https://api.datamuse.com/words?ml=test&max=5');
            expect(result).toEqual([{ word: 'test' }]);
        });

        it('should return empty array on network failure', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockRejectedValue(new Error('Network error'));

            const result = await api.getRelatedWords('test');

            expect(result).toEqual([]);
        });

        it('should return empty array when safeFetch returns null', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(null);

            const result = await api.getRelatedWords('test');

            expect(result).toEqual([]);
        });

        it('should encode the word parameter', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            const { en } = await import('../../extension/utils/shortcuts/global.js');
            sf.mockResolvedValue([]);

            await api.getRelatedWords('test word');

            expect(en).toHaveBeenCalledWith('test word');
        });
    });
});