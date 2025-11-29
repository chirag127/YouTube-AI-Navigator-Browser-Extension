import { describe, it, expect } from 'vitest';
import {
    validateSegments,
    formatTimestamp,
    createClickableTimestamp,
} from '../extension/services/segments/timestamp-validator.js';

describe('Timestamp Validator', () => {
    it('should validate segments', () => {
        const segments = [
            { start: 0, end: 10, text: 'A' },
            { start: 10, end: 20, text: 'B' },
        ];
        const result = validateSegments(segments);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });

    it('should handle segments with duration', () => {
        const segments = [{ start: 0, end: -1, duration: 10, text: 'A' }];
        const result = validateSegments(segments);
        expect(result[0].end).toBe(10);
    });

    it('should handle highlight segments', () => {
        const segments = [{ start: 5, end: 15, label: 'Highlight', text: 'H' }];
        const result = validateSegments(segments);
        expect(result[0].hasEndTimestamp).toBe(false);
    });

    it('should format timestamp', () => {
        expect(formatTimestamp(0)).toBe('0:00');
        expect(formatTimestamp(65)).toBe('1:05');
        expect(formatTimestamp(3665)).toBe('1:01:05');
    });

    it('should create clickable timestamp', () => {
        const onClick = () => { };
        const ts = createClickableTimestamp(100, 'start', onClick);
        expect(ts.time).toBe(100);
        expect(ts.clickable).toBe(true);
        expect(ts.formatted).toBeDefined();
    });

    it('should handle empty segments', () => {
        const result = validateSegments([]);
        expect(result).toEqual([]);
    });

    it('should handle invalid input', () => {
        const result = validateSegments(null);
        expect(result).toEqual([]);
    });
});
