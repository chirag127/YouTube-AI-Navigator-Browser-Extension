import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIDetector } from '../extension/api/core/api-detector.js';

global.fetch = vi.fn();
global.AbortSignal = { timeout: vi.fn(() => ({})) };

vi.mock('../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
  l: vi.fn(),
}));

describe('API Detector Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SponsorBlock Detection', () => {
    it('should detect available SponsorBlock', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200 });
      const result = await APIDetector.checkSponsorBlock();
      expect(result).toBe(true);
    });

    it('should handle SponsorBlock 400 as available', async () => {
      global.fetch.mockResolvedValue({ ok: false, status: 400 });
      const result = await APIDetector.checkSponsorBlock();
      expect(result).toBe(true);
    });

    it('should detect unavailable SponsorBlock', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const result = await APIDetector.checkSponsorBlock();
      expect(result).toBe(false);
    });
  });

  describe('DeArrow Detection', () => {
    it('should detect available DeArrow', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200 });
      const result = await APIDetector.checkDeArrow();
      expect(result).toBe(true);
    });

    it('should detect unavailable DeArrow', async () => {
      global.fetch.mockRejectedValue(new Error('Timeout'));
      const result = await APIDetector.checkDeArrow();
      expect(result).toBe(false);
    });
  });

  describe('Gemini Detection', () => {
    it('should return false without API key', async () => {
      const result = await APIDetector.checkGemini(null);
      expect(result).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should detect valid Gemini key', async () => {
      global.fetch.mockResolvedValue({ ok: true, status: 200 });
      const result = await APIDetector.checkGemini('test-key');
      expect(result).toBe(true);
    });

    it('should detect invalid Gemini key', async () => {
      global.fetch.mockRejectedValue(new Error('Invalid key'));
      const result = await APIDetector.checkGemini('bad-key');
      expect(result).toBe(false);
    });
  });

  describe('TMDB Detection', () => {
    it('should return false without API key', async () => {
      const result = await APIDetector.checkTMDB(null);
      expect(result).toBe(false);
    });

    it('should detect valid TMDB key', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const result = await APIDetector.checkTMDB('tmdb-key');
      expect(result).toBe(true);
    });
  });

  describe('NewsData Detection', () => {
    it('should return false without API key', async () => {
      const result = await APIDetector.checkNewsData('');
      expect(result).toBe(false);
    });

    it('should detect valid NewsData key', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const result = await APIDetector.checkNewsData('news-key');
      expect(result).toBe(true);
    });
  });

  describe('GoogleFactCheck Detection', () => {
    it('should return false without API key', async () => {
      const result = await APIDetector.checkGoogleFactCheck(undefined);
      expect(result).toBe(false);
    });

    it('should detect valid GoogleFactCheck key', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const result = await APIDetector.checkGoogleFactCheck('gfc-key');
      expect(result).toBe(true);
    });
  });

  describe('Get All Available APIs', () => {
    it('should check all APIs with config', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const config = {
        ai: { apiKey: 'gemini-key' },
        externalApis: {
          tmdb: 'tmdb-key',
          newsData: 'news-key',
          googleFactCheck: 'gfc-key',
        },
      };
      const result = await APIDetector.getAvailableAPIs(config);
      expect(result).toEqual({
        sponsorBlock: true,
        deArrow: true,
        gemini: true,
        tmdb: true,
        newsData: true,
        googleFactCheck: true,
      });
    });

    it('should handle empty config', async () => {
      global.fetch.mockResolvedValue({ ok: true });
      const result = await APIDetector.getAvailableAPIs({});
      expect(result.sponsorBlock).toBe(true);
      expect(result.gemini).toBe(false);
      expect(result.tmdb).toBe(false);
    });

    it('should handle mixed availability', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) return Promise.resolve({ ok: true });
        return Promise.reject(new Error('Unavailable'));
      });
      const config = {
        ai: { apiKey: 'key' },
        externalApis: { tmdb: 'key', newsData: 'key' },
      };
      const result = await APIDetector.getAvailableAPIs(config);
      expect(result.sponsorBlock).toBe(true);
      expect(result.deArrow).toBe(true);
      expect(result.gemini).toBe(false);
    });
  });
});
