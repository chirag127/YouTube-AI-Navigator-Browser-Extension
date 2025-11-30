import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIDetector } from '../../../extension/api/core/api-detector.js';

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
    l: vi.fn(),
}));

describe('APIDetector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkSponsorBlock', () => {
        it('should return true on ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkSponsorBlock();

            expect(result).toBe(true);
        });

        it('should return true on 400 response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 400 });

            const result = await APIDetector.checkSponsorBlock();

            expect(result).toBe(true);
        });

        it('should return false on failure', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('error'));

            const result = await APIDetector.checkSponsorBlock();

            expect(result).toBe(false);
        });
    });

    describe('checkDeArrow', () => {
        it('should return true on success', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkDeArrow();

            expect(result).toBe(true);
        });

        it('should return false on failure', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('error'));

            const result = await APIDetector.checkDeArrow();

            expect(result).toBe(false);
        });
    });

    describe('checkGemini', () => {
        it('should return true with apiKey and ok response', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkGemini('key');

            expect(result).toBe(true);
        });

        it('should return false without apiKey', async () => {
            const result = await APIDetector.checkGemini('');

            expect(result).toBe(false);
        });

        it('should return false on failure', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('error'));

            const result = await APIDetector.checkGemini('key');

            expect(result).toBe(false);
        });
    });

    describe('checkTMDB', () => {
        it('should return true on success', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkTMDB('key');

            expect(result).toBe(true);
        });

        it('should return false without apiKey', async () => {
            const result = await APIDetector.checkTMDB('');

            expect(result).toBe(false);
        });
    });

    describe('checkNewsData', () => {
        it('should return true on success', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkNewsData('key');

            expect(result).toBe(true);
        });

        it('should return false without apiKey', async () => {
            const result = await APIDetector.checkNewsData('');

            expect(result).toBe(false);
        });
    });

    describe('checkGoogleFactCheck', () => {
        it('should return true on success', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.checkGoogleFactCheck('key');

            expect(result).toBe(true);
        });

        it('should return false without apiKey', async () => {
            const result = await APIDetector.checkGoogleFactCheck('');

            expect(result).toBe(false);
        });
    });

    describe('getAvailableAPIs', () => {
        it('should return availability object', async () => {
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await APIDetector.getAvailableAPIs();

            expect(result).toHaveProperty('sponsorBlock');
            expect(result).toHaveProperty('deArrow');
            expect(result).toHaveProperty('gemini');
            expect(result).toHaveProperty('tmdb');
            expect(result).toHaveProperty('newsData');
            expect(result).toHaveProperty('googleFactCheck');
        });
    });
});