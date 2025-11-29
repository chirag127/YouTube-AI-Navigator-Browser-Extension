import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiClient } from '../extension/api/gemini-client.js';

vi.mock('../extension/api/core/http-client.js', () => ({
    HttpClient: class MockHttpClient {
        async fetch() {
            return {
                json: async () => ({
                    candidates: [{ content: { parts: [{ text: 'Test response' }] } }],
                }),
            };
        }
    },
}));

vi.mock('../extension/api/core/rate-limiter.js', () => ({
    RateLimiter: class MockRateLimiter {
        async acquire() { }
        getStats() {
            return { activeRequests: 0, maxRequests: 15, queueLength: 0, available: 15 };
        }
    },
}));

vi.mock('../extension/utils/shortcuts/log.js', () => ({
    l: vi.fn(),
    e: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/core.js', () => ({
    js: vi.fn(v => JSON.stringify(v)),
}));

describe('GeminiClient', () => {
    let client;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new GeminiClient('test-api-key');
    });

    it('should initialize with API key', () => {
        expect(client.apiKey).toBe('test-api-key');
    });

    it('should generate content', async () => {
        const result = await client.generateContent('Test prompt', 'gemini-2.0-flash-exp');
        expect(result).toBe('Test response');
    });

    it('should handle array prompts', async () => {
        const result = await client.generateContent([{ text: 'Test' }], 'gemini-2.0-flash-exp');
        expect(result).toBe('Test response');
    });

    it('should get rate limit stats', () => {
        const stats = client.getRateLimitStats();
        expect(stats.maxRequests).toBe(15);
        expect(stats.available).toBe(15);
    });

    it('should use custom base URL', () => {
        const customClient = new GeminiClient('key', { baseUrl: 'https://custom.api' });
        expect(customClient.baseUrl).toBe('https://custom.api');
    });
});
