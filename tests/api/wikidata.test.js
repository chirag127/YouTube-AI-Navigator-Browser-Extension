import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchWikidata, WikidataAPI } from '../../extension/api/wikidata.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

describe('Wikidata API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('searchWikidata', () => {
        it('should return entity on success', async () => {
            const mockData = { search: [{ id: 'Q1' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { wikidata: { enabled: true } } });

            const result = await searchWikidata('query');

            expect(sf).toHaveBeenCalledWith(
                'https://www.wikidata.org/w/api.php?action=wbsearchentities&search=query&language=en&format=json&origin=*'
            );
            expect(result).toEqual({ id: 'Q1' });
        });

        it('should return null when disabled', async () => {
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { wikidata: { enabled: false } } });

            const result = await searchWikidata('query');

            expect(result).toBeNull();
        });

        it('should return null on no search results', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue({ search: [] });
            const { sg } = await import('../../extension/utils/shortcuts/storage.js');
            sg.mockResolvedValue({ integrations: { wikidata: { enabled: true } } });

            const result = await searchWikidata('query');

            expect(result).toBeNull();
        });
    });

    describe('WikidataAPI', () => {
        let api;

        beforeEach(() => {
            api = new WikidataAPI();
        });

        describe('searchEntity', () => {
            it('should call searchWikidata', async () => {
                const mockData = { id: 'Q1' };
                const { sf } = await import('../../extension/utils/shortcuts/network.js');
                sf.mockResolvedValue({ search: [mockData] });
                const { sg } = await import('../../extension/utils/shortcuts/storage.js');
                sg.mockResolvedValue({ integrations: { wikidata: { enabled: true } } });

                const result = await api.searchEntity('query');

                expect(result).toEqual(mockData);
            });
        });

        describe('getEntityDetails', () => {
            it('should return entity details', async () => {
                const mockData = { entities: { Q1: { label: 'Entity' } } };
                const { sf } = await import('../../extension/utils/shortcuts/network.js');
                sf.mockResolvedValue(mockData);

                const result = await api.getEntityDetails('Q1');

                expect(sf).toHaveBeenCalledWith(
                    'https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q1&format=json&origin=*'
                );
                expect(result).toEqual({ label: 'Entity' });
            });

            it('should return null for no id', async () => {
                const result = await api.getEntityDetails('');

                expect(result).toBeNull();
            });

            it('should return null on no entities', async () => {
                const { sf } = await import('../../extension/utils/shortcuts/network.js');
                sf.mockResolvedValue({ entities: {} });

                const result = await api.getEntityDetails('Q1');

                expect(result).toBeNull();
            });
        });
    });
});