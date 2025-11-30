import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSegments } from '../extension/api/sponsorblock.js';
import { SEGMENT_CATEGORIES } from '../extension/options/modules/settings-manager.js';

global.fetch = vi.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
    },
  },
  writable: true,
});

vi.mock('../extension/utils/shortcuts/chrome.js', () => ({
  cwr: vi.fn(),
}));
vi.mock('../extension/utils/shortcuts/dom.js', () => ({
  ce: vi.fn(),
}));

describe('SponsorBlock Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Label Mapping', () => {
    it('should import LM from segments.js shortcuts', async () => {
      const { LM } = await import('../extension/utils/shortcuts/segments.js');
      expect(LM).toBeDefined();
      expect(LM.sponsor).toBe('Sponsor');
      expect(LM.content).toBe('Content');
      expect(LM.chapter).toBe('Chapter');
    });

    it('should have all 13 categories', async () => {
      const sb = await import('../extension/api/sponsorblock.js');
      // Access the CATEGORIES constant from the module namespace
      const categoriesModule = await import('../extension/api/sponsorblock.js?t=' + Date.now());
      expect(SEGMENT_CATEGORIES.length).toBe(13);
      const expected = [
        'sponsor',
        'selfpromo',
        'interaction',
        'intro',
        'outro',
        'preview',
        'hook',
        'music_offtopic',
        'poi_highlight',
        'filler',
        'exclusive_access',
        'chapter',
        'content',
      ];
      expected.forEach(cat => expect(SEGMENT_CATEGORIES.find(c => c.id === cat)).toBeDefined());
    });

    it('should match SEGMENT_CATEGORIES count', () => {
      expect(SEGMENT_CATEGORIES.length).toBe(13);
    });
  });

  describe('API Fetching', () => {
    it('should fetch segments successfully', async () => {
      const mockResponse = [{
        videoID: 'test123',
        segments: [
          { segment: [10, 20], category: 'sponsor', UUID: 'uuid1', votes: 5, locked: false },
          { segment: [30, 40], category: 'content', UUID: 'uuid2', votes: 2, locked: false },
        ],
      }];
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchSegments('test123');
      expect(result.length).toBe(2);
      expect(result[0].label).toBe('sponsor');
      expect(result[0].labelFull).toBe('Sponsor');
      expect(result[1].label).toBe('content');
      expect(result[1].labelFull).toBe('Content');
    });

    it('should handle 404 responses', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });
      const result = await fetchSegments('nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle 429 rate limit', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
      });
      const result = await fetchSegments('test123');
      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network failure'));
      const result = await fetchSegments('test123');
      expect(result).toEqual([]);
    });

    it('should return empty array for missing videoID', async () => {
      const result = await fetchSegments(null);
      expect(result).toEqual([]);
    });
  });

  describe('Segment Mapping', () => {
    it('should map all 13 categories correctly', async () => {
      const mockSegments = [
        { segment: [0, 10], category: 'sponsor', UUID: '1', votes: 1, locked: false },
        { segment: [10, 20], category: 'selfpromo', UUID: '2', votes: 1, locked: false },
        { segment: [20, 30], category: 'interaction', UUID: '3', votes: 1, locked: false },
        { segment: [30, 40], category: 'intro', UUID: '4', votes: 1, locked: false },
        { segment: [40, 50], category: 'outro', UUID: '5', votes: 1, locked: false },
        { segment: [50, 60], category: 'preview', UUID: '6', votes: 1, locked: false },
        { segment: [60, 70], category: 'hook', UUID: '7', votes: 1, locked: false },
        { segment: [70, 80], category: 'music_offtopic', UUID: '8', votes: 1, locked: false },
        { segment: [80, 90], category: 'poi_highlight', UUID: '9', votes: 1, locked: false },
        { segment: [90, 100], category: 'filler', UUID: '10', votes: 1, locked: false },
        { segment: [100, 110], category: 'exclusive_access', UUID: '11', votes: 1, locked: false },
        { segment: [110, 120], category: 'chapter', UUID: '12', votes: 1, locked: false },
        { segment: [120, 130], category: 'content', UUID: '13', votes: 1, locked: false },
      ];
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ videoID: 'test', segments: mockSegments }]),
      });

      const result = await fetchSegments('test');
      expect(result.length).toBe(13);
      result.forEach((seg, i) => {
        expect(seg.category).toBe(mockSegments[i].category);
        expect(seg.labelFull).toBeDefined();
      });
    });
  });
});
