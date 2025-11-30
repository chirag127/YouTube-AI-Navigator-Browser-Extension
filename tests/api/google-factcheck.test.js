import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleFactCheckAPI } from '../../extension/api/google-factcheck.js';

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    en: vi.fn((str) => encodeURIComponent(str)),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    sf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

describe('GoogleFactCheckAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new GoogleFactCheckAPI('test-key');
    });

    describe('constructor', () => {
        it('should set apiKey', () => {
            expect(api.apiKey).toBe('test-key');
        });
    });

    describe('searchClaims', () => {
        it('should return claims on success', async () => {
            const mockData = { claims: [{ text: 'claim' }] };
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(mockData);

            const result = await api.searchClaims('query');

            expect(sf).toHaveBeenCalledWith(
                'https://factchecktools.googleapis.com/v1alpha1/claims:search?key=test-key&query=query'
            );
            expect(result).toEqual([{ text: 'claim' }]);
        });

        it('should return empty array on failure', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockRejectedValue(new Error('error'));

            const result = await api.searchClaims('query');

            expect(result).toEqual([]);
        });

        it('should return empty array when no apiKey', async () => {
            const noKeyApi = new GoogleFactCheckAPI();

            const result = await noKeyApi.searchClaims('query');

            expect(result).toEqual([]);
        });

        it('should return empty array when safeFetch returns null', async () => {
            const { sf } = await import('../../extension/utils/shortcuts/network.js');
            sf.mockResolvedValue(null);

            const result = await api.searchClaims('query');

            expect(result).toEqual([]);
        });
    });
});