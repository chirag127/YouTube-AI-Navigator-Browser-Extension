import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkingService } from '../extension/services/chunking/index.js';

describe('ChunkingService', () => {
    let service;

    beforeEach(() => {
        service = new ChunkingService();
    });

    it('should initialize', () => {
        expect(service).toBeDefined();
        expect(service.defaultChunkSize).toBe(500000);
    });

    it('should chunk text', () => {
        const text = 'word '.repeat(1000);
        const chunks = service.chunkText(text, 500);
        expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle empty text', () => {
        const chunks = service.chunkText('', 100);
        expect(Array.isArray(chunks)).toBe(true);
    });

    it('should chunk transcript segments', () => {
        const segments = [
            { start: 0, end: 10, text: 'First' },
            { start: 10, end: 20, text: 'Second' },
        ];
        const chunks = service.chunkSegments(segments, 1000);
        expect(Array.isArray(chunks)).toBe(true);
    });

    it('should use default chunk size', () => {
        const text = 'test';
        const chunks = service.chunkText(text);
        expect(Array.isArray(chunks)).toBe(true);
    });
});
