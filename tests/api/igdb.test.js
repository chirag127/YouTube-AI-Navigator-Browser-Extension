import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IgdbAPI } from '../../extension/api/igdb.js';

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    w: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    ft: vi.fn(),
}));

describe('IgdbAPI', () => {
    let api;

    beforeEach(() => {
        vi.clearAllMocks();
        api = new IgdbAPI('client-id', 'token');
    });

    describe('constructor', () => {
        it('should set clientId and accessToken', () => {
            expect(api.clientId).toBe('client-id');
            expect(api.accessToken).toBe('token');
        });
    });

    describe('searchGame', () => {
        it('should return game on success', async () => {
            const mockResult = [{ name: 'Game' }];
            const { ft } = await import('../../extension/utils/shortcuts/network.js');
            ft.mockResolvedValue(mockResult);

            const result = await api.searchGame('query');

            expect(ft).toHaveBeenCalledWith('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': 'client-id',
                    Authorization: 'Bearer token',
                },
                body: 'search "query"; fields name, cover.url, summary; limit 1;',
            });
            expect(result).toEqual({ name: 'Game' });
        });

        it('should return null on no results', async () => {
            const { ft } = await import('../../extension/utils/shortcuts/network.js');
            ft.mockResolvedValue([]);

            const result = await api.searchGame('query');

            expect(result).toBeNull();
        });

        it('should return null when no credentials', async () => {
            const noCredApi = new IgdbAPI();

            const result = await noCredApi.searchGame('query');

            expect(result).toBeNull();
        });

        it('should return null on failure', async () => {
            const { ft } = await import('../../extension/utils/shortcuts/network.js');
            ft.mockRejectedValue(new Error('error'));

            const result = await api.searchGame('query');

            expect(result).toBeNull();
        });
    });
});