import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SemanticScholarAPI } from '../../extension/api/semanticscholar.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

describe('SemanticScholarAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new SemanticScholarAPI();
    });

    describe('searchPaper', () => {
        it('should return paper on success', async () => {
            const mockData = { data: [{ title: 'Paper' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchPaper('query');

            expect(sf).toHaveBeenCalledWith(
                'https://api.semanticscholar.org/graph/v1/paper/search?query=query&limit=1&fields=title,authors,year,abstract'
            );
            expect(result).toEqual({ title: 'Paper' });
        });

        it('should return null on no data', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue({ data: [] });

            const result = await api.searchPaper('query');

            expect(result).toBeNull();
        });

        it('should return null on failure', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockRejectedValue(new Error('error'));

            const result = await api.searchPaper('query');

            expect(result).toBeNull();
        });
    });
});