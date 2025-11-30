import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenLibraryAPI } from '../../extension/api/openlibrary.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

describe('OpenLibraryAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new OpenLibraryAPI();
    });

    describe('searchBook', () => {
        it('should return book on success', async () => {
            const mockData = { docs: [{ title: 'Book' }] };
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue(mockData),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openlibrary: { enabled: true } } });

            const result = await api.searchBook('query');

            expect(global.fetch).toHaveBeenCalledWith(
                'https://openlibrary.org/search.json?q=query'
            );
            expect(result).toEqual({ title: 'Book' });
        });

        it('should return null when disabled', async () => {
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openlibrary: { enabled: false } } });

            const result = await api.searchBook('query');

            expect(result).toBeNull();
        });

        it('should return null on no docs', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                json: vi.fn().mockResolvedValue({ docs: [] }),
            });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { openlibrary: { enabled: true } } });

            const result = await api.searchBook('query');

            expect(result).toBeNull();
        });
    });

    describe('getWork', () => {
        it('should return work data', async () => {
            const mockData = { title: 'Work' };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.getWork('/works/OL123');

            expect(sf).toHaveBeenCalledWith('https://openlibrary.org/works/OL123.json');
            expect(result).toEqual(mockData);
        });

        it('should return null for empty key', async () => {
            const result = await api.getWork('');

            expect(result).toBeNull();
        });
    });
});