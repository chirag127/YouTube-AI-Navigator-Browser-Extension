import { lk, ln, lgc, LM, CM } from '../extension/utils/shortcuts/segments.js';

describe('Segment Label Mapping Tests', () => {
  describe('Label Key Mapping (lk)', () => {
    it('should map all 13 SponsorBlock categories', () => {
      expect(lk('sponsor')).toBe('sponsor');
      expect(lk('selfpromo')).toBe('selfpromo');
      expect(lk('interaction')).toBe('interaction');
      expect(lk('intro')).toBe('intro');
      expect(lk('outro')).toBe('outro');
      expect(lk('preview')).toBe('preview');
      expect(lk('hook')).toBe('hook');
      expect(lk('music_offtopic')).toBe('music_offtopic');
      expect(lk('poi_highlight')).toBe('poi_highlight');
      expect(lk('filler')).toBe('filler');
      expect(lk('exclusive_access')).toBe('exclusive_access');
      expect(lk('chapter')).toBe('chapter');
      expect(lk('content')).toBe('content');
    });

    it('should map label variations to keys', () => {
      expect(lk('Sponsor')).toBe('sponsor');
      expect(lk('Self Promotion')).toBe('selfpromo');
      expect(lk('Self Promotion/Unpaid Promotion')).toBe('selfpromo');
      expect(lk('Unpaid/Self Promotion')).toBe('selfpromo');
      expect(lk('Interaction Reminder')).toBe('interaction');
      expect(lk('Intermission/Intro Animation')).toBe('intro');
      expect(lk('Intermission/Intro')).toBe('intro');
      expect(lk('Intro')).toBe('intro');
      expect(lk('Endcards/Credits')).toBe('outro');
      expect(lk('Outro')).toBe('outro');
      expect(lk('Preview/Recap')).toBe('preview');
      expect(lk('Preview')).toBe('preview');
      expect(lk('Tangents/Jokes')).toBe('filler');
      expect(lk('Filler/Tangent')).toBe('filler');
      expect(lk('Filler')).toBe('filler');
      expect(lk('Highlight')).toBe('poi_highlight');
      expect(lk('Exclusive Access')).toBe('exclusive_access');
      expect(lk('Off-Topic')).toBe('music_offtopic');
      expect(lk('Music: Non-Music Section')).toBe('music_offtopic');
      expect(lk('Music: Off-Topic')).toBe('music_offtopic');
      expect(lk('Hook/Greetings')).toBe('hook');
      expect(lk('Hook')).toBe('hook');
      expect(lk('Chapter')).toBe('chapter');
      expect(lk('Content')).toBe('content');
      expect(lk('Main Content')).toBe('content');
      expect(lk('Content (Main Video)')).toBe('content');
    });

    it('should handle null/undefined with default', () => {
      expect(lk(null)).toBe('content');
      expect(lk(undefined)).toBe('content');
      expect(lk('')).toBe('content');
    });

    it('should handle unknown labels with fallback', () => {
      expect(lk('Unknown Label')).toBe('unknown_label');
      expect(lk('New Category')).toBe('new_category');
    });
  });

  describe('Label Name Mapping (ln)', () => {
    it('should return full names for all categories', () => {
      expect(ln('sponsor')).toBe('Sponsor');
      expect(ln('selfpromo')).toBe('Self Promotion');
      expect(ln('interaction')).toBe('Interaction Reminder');
      expect(ln('intro')).toBe('Intro');
      expect(ln('outro')).toBe('Outro');
      expect(ln('preview')).toBe('Preview');
      expect(ln('hook')).toBe('Hook');
      expect(ln('music_offtopic')).toBe('Music: Off-Topic');
      expect(ln('poi_highlight')).toBe('Highlight');
      expect(ln('filler')).toBe('Filler');
      expect(ln('exclusive_access')).toBe('Exclusive Access');
      expect(ln('chapter')).toBe('Chapter');
      expect(ln('content')).toBe('Content');
    });

    it('should return input for unknown categories', () => {
      expect(ln('unknown')).toBe('unknown');
    });
  });

  describe('Label Color Mapping (lgc)', () => {
    it('should return colors for all categories', () => {
      expect(lgc('sponsor')).toBe('#00d26a');
      expect(lgc('selfpromo')).toBe('#ffff00');
      expect(lgc('interaction')).toBe('#a020f0');
      expect(lgc('intro')).toBe('#00ffff');
      expect(lgc('outro')).toBe('#0000ff');
      expect(lgc('preview')).toBe('#00bfff');
      expect(lgc('hook')).toBe('#4169e1');
      expect(lgc('music_offtopic')).toBe('#ff9900');
      expect(lgc('poi_highlight')).toBe('#ff0055');
      expect(lgc('filler')).toBe('#9400d3');
      expect(lgc('exclusive_access')).toBe('#008b45');
      expect(lgc('chapter')).toBe('#1e90ff');
      expect(lgc('content')).toBe('#999999');
    });

    it('should return default color for unknown categories', () => {
      expect(lgc('unknown')).toBe('#999999');
    });
  });

  describe('Consistency Checks', () => {
    it('should have matching keys in LM and CM', () => {
      const lmKeys = Object.keys(LM);
      const cmKeys = Object.keys(CM);
      expect(lmKeys.sort()).toEqual(cmKeys.sort());
    });

    it('should have all 13 categories in both maps', () => {
      expect(Object.keys(LM).length).toBe(13);
      expect(Object.keys(CM).length).toBe(13);
    });

    it('should have unique colors', () => {
      const colors = Object.values(CM);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });
});
