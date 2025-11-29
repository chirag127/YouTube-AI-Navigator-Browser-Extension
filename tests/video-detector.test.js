import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../extension/utils/shortcuts/string.js', () => ({
    mt: vi.fn((str, regex) => str?.match(regex)),
}));

vi.mock('../extension/utils/shortcuts/global.js', () => ({
    loc: { href: 'https://www.youtube.com/watch?v=test123', pathname: '/watch' },
}));

describe('Video Detector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract video ID from URL', async () => {
        const { extractVideoId } = await import('../extension/services/video/detector.js');
        const id = extractVideoId('https://www.youtube.com/watch?v=abc123');
        expect(id).toBe('abc123');
    });

    it('should extract video ID from short URL', async () => {
        const { extractVideoId } = await import('../extension/services/video/detector.js');
        const id = extractVideoId('https://youtu.be/xyz789');
        expect(id).toBe('xyz789');
    });

    it('should return null for invalid URL', async () => {
        const { extractVideoId } = await import('../extension/services/video/detector.js');
        const id = extractVideoId('https://example.com');
        expect(id).toBeNull();
    });

    it('should detect video page', async () => {
        const { isVideoPage } = await import('../extension/services/video/detector.js');
        const result = isVideoPage();
        expect(result).toBe(true);
    });

    it('should get current video ID', async () => {
        const { getCurrentVideoId } = await import('../extension/services/video/detector.js');
        const id = getCurrentVideoId();
        expect(id).toBe('test123');
    });
});
