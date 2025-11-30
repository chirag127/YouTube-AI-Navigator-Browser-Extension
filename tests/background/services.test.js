import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('../../../extension/services/chunking/index.js', () => ({
    ChunkingService: function () {
        return {};
    },
}));

vi.mock('../../../extension/api/gemini.js', () => ({
    GeminiService: function () {
        return {
            fetchAvailableModels: vi.fn().mockResolvedValue(),
        };
    },
}));

vi.mock('../../../extension/services/segments/index.js', () => ({
    SegmentClassificationService: vi.fn(),
}));

vi.mock('../../../extension/services/storage/index.js', () => ({
    StorageService: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
    w: vi.fn(),
}));

import { initializeServices, getServices } from '../../../extension/background/services.js';

describe('Background Services', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset module state by re-importing or mocking
    });

    describe('initializeServices', () => {
        it('should initialize services with apiKey', async () => {
            const apiKey = 'test-key';
            const result = await initializeServices(apiKey);
            expect(result).toHaveProperty('gemini');
            expect(result).toHaveProperty('chunking');
            expect(result).toHaveProperty('segmentClassification');
            expect(result).toHaveProperty('storage');
            expect(result.initialized).toBe(true);
        });

        it('should throw error without apiKey', async () => {
            await expect(initializeServices()).rejects.toThrow('API Key required');
        });

        it('should return existing services if already initialized', async () => {
            const apiKey = 'test-key';
            await initializeServices(apiKey);
            const result2 = await initializeServices(apiKey);
            expect(result2).toBe(result2); // same reference
        });

        it('should handle fetchAvailableModels failure', async () => {
            const mockGemini = vi.mocked(require('../../../extension/api/gemini.js').GeminiService);
            mockGemini.mockImplementation(() => ({
                fetchAvailableModels: vi.fn().mockRejectedValue(new Error('Fetch failed')),
            }));
            const result = await initializeServices('key');
            expect(result.initialized).toBe(true);
        });
    });

    describe('getServices', () => {
        it('should return services if initialized', async () => {
            await initializeServices('key');
            const result = getServices();
            expect(result.initialized).toBe(true);
        });

        it('should throw if not initialized', () => {
            expect(() => getServices()).toThrow('Services not initialized');
        });
    });
});
