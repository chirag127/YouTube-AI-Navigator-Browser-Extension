import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiClient } from '../../extension/api/gemini-client.js';

vi.mock('../../extension/api/core/http-client.js', () => ({
    HttpClient: vi.fn().mockImplementation(() => ({
        fetch: vi.fn(),
    })),
}));

vi.mock('../../extension/api/core/error-handler.js', () => ({
    ErrorHandler: {
        createUserError: vi.fn((error) => error),
    },
}));

vi.mock('../../extension/api/core/rate-limiter.js', () => ({
    RateLimiter: vi.fn().mockImplementation(() => ({
        acquire: vi.fn(),
        getStats: vi.fn().mockReturnValue({}),
    })),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/core.js', () => ({
    js: vi.fn((obj) => JSON.stringify(obj)),
}));

vi.mock('../../extension/utils/shortcuts/array.js', () => ({
    isa: vi.fn((val) => Array.isArray(val)),
}));

describe('GeminiClient', () => {
    let client;
    let mockHttpClient;
    let mockRateLimiter;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new GeminiClient('test-key', {
            baseUrl: 'https://test.com',
            maxRetries: 1,
            maxRequestsPerMinute: 10,
        });
        mockHttpClient = client.httpClient;
        mockRateLimiter = client.rateLimiter;
    });

    describe('constructor', () => {
        it('should initialize with default config', () => {
            const defaultClient = new GeminiClient('key');

            expect(defaultClient.apiKey).toBe('key');
            expect(defaultClient.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta');
        });

        it('should initialize with custom config', () => {
            expect(client.apiKey).toBe('test-key');
            expect(client.baseUrl).toBe('https://test.com');
        });
    });

    describe('generateContent', () => {
        it('should generate content successfully', async () => {
            const mockResponse = {
                json: vi.fn().mockResolvedValue({
                    candidates: [{ content: { parts: [{ text: 'Generated text' }] } }],
                }),
            };
            mockHttpClient.fetch.mockResolvedValue(mockResponse);
            mockRateLimiter.acquire.mockResolvedValue();

            const result = await client.generateContent('prompt', 'model-1');

            expect(mockRateLimiter.acquire).toHaveBeenCalled();
            expect(mockHttpClient.fetch).toHaveBeenCalledWith(
                'https://test.com/models/model-1:generateContent?key=test-key',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'prompt' }] }] }),
                })
            );
            expect(result).toBe('Generated text');
        });

        it('should handle array prompt', async () => {
            const mockResponse = {
                json: vi.fn().mockResolvedValue({
                    candidates: [{ content: { parts: [{ text: 'Response' }] } }],
                }),
            };
            mockHttpClient.fetch.mockResolvedValue(mockResponse);
            mockRateLimiter.acquire.mockResolvedValue();

            const result = await client.generateContent([{ text: 'part1' }, { text: 'part2' }], 'model');

            expect(mockHttpClient.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'part1' }, { text: 'part2' }] }] }),
                })
            );
            expect(result).toBe('Response');
        });

        it('should throw error on no content', async () => {
            const mockResponse = {
                json: vi.fn().mockResolvedValue({}),
            };
            mockHttpClient.fetch.mockResolvedValue(mockResponse);
            mockRateLimiter.acquire.mockResolvedValue();

            await expect(client.generateContent('prompt', 'model')).rejects.toThrow('No content');
        });

        it('should handle network failure', async () => {
            mockHttpClient.fetch.mockRejectedValue(new Error('Network error'));
            mockRateLimiter.acquire.mockResolvedValue();

            await expect(client.generateContent('prompt', 'model')).rejects.toThrow();
        });
    });

    describe('getRateLimitStats', () => {
        it('should return rate limiter stats', () => {
            const stats = { requests: 5 };
            mockRateLimiter.getStats.mockReturnValue(stats);

            const result = client.getRateLimitStats();

            expect(result).toEqual(stats);
        });
    });
});