import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpClient } from '../extension/api/core/http-client.js';

vi.mock('../extension/utils/shortcuts/log.js', () => ({
    l: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn((fn, delay) => setTimeout(fn, delay)),
    co: vi.fn(id => clearTimeout(id)),
}));

vi.mock('../extension/utils/shortcuts/math.js', () => ({
    mn: vi.fn((a, b) => Math.min(a, b)),
}));

vi.mock('../extension/utils/shortcuts/async.js', () => ({
    np: vi.fn(fn => new Promise(fn)),
}));

global.fetch = vi.fn();

describe('HttpClient', () => {
    let client;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new HttpClient({ maxRetries: 2, initialDelay: 100, timeout: 5000 });
    });

    it('should initialize with config', () => {
        expect(client.maxRetries).toBe(2);
        expect(client.initialDelay).toBe(100);
        expect(client.timeout).toBe(5000);
    });

    it('should fetch successfully', async () => {
        global.fetch.mockResolvedValue({ ok: true, status: 200 });
        const response = await client.fetch('https://test.com');
        expect(response.ok).toBe(true);
    });

    it('should retry on 500 error', async () => {
        global.fetch
            .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
            .mockResolvedValueOnce({ ok: true, status: 200 });
        const response = await client.fetch('https://test.com');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 404', async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: async () => ({}),
        });
        await expect(client.fetch('https://test.com')).rejects.toThrow();
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use default config', () => {
        const defaultClient = new HttpClient();
        expect(defaultClient.maxRetries).toBe(3);
        expect(defaultClient.timeout).toBe(30000);
    });
});
