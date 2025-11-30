import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelManager } from '../../extension/api/models.js';

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    w: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    jf: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/array.js', () => ({
    afl: vi.fn((arr, fn) => arr.filter(fn)),
    am: vi.fn((arr, fn) => arr.map(fn)),
}));

vi.mock('../../extension/utils/shortcuts/string.js', () => ({
    rp: vi.fn((str, regex, repl) => str.replace(regex, repl)),
}));

describe('ModelManager', () => {
    let manager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new ModelManager('api-key', 'base-url');
    });

    describe('constructor', () => {
        it('should set apiKey, baseUrl, and empty models', () => {
            expect(manager.apiKey).toBe('api-key');
            expect(manager.baseUrl).toBe('base-url');
            expect(manager.models).toEqual([]);
        });
    });

    describe('fetch', () => {
        it('should fetch and set models', async () => {
            const mockData = {
                models: [
                    { name: 'models/model1', supportedGenerationMethods: ['generateContent'] },
                    { name: 'models/model2', supportedGenerationMethods: [] },
                ],
            };
            const { jf } = await import('../../extension/utils/shortcuts/network.js');
            jf.mockResolvedValue(mockData);

            const result = await manager.fetch();

            expect(jf).toHaveBeenCalledWith('base-url/models?key=api-key');
            expect(manager.models).toEqual(['model1']);
            expect(result).toEqual(['model1']);
        });

        it('should do nothing without apiKey', async () => {
            const noKeyManager = new ModelManager();

            const result = await noKeyManager.fetch();

            expect(result).toBeUndefined();
        });

        it('should handle failure', async () => {
            const { jf } = await import('../../extension/utils/shortcuts/network.js');
            jf.mockRejectedValue(new Error('error'));

            await manager.fetch();

            expect(manager.models).toEqual([]);
        });
    });

    describe('getList', () => {
        it('should return sorted models', () => {
            manager.models = ['gemini-1.5-pro-002', 'custom-model'];

            const result = manager.getList();

            expect(result).toEqual(['gemini-1.5-pro-002', 'custom-model']);
        });

        it('should return default list when no models', () => {
            const result = manager.getList();

            expect(result).toContain('gemini-2.5-flash-lite-preview-09-2025');
        });
    });
});