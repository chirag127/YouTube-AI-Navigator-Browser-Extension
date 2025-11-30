import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('../../../extension/api/gemini-client.js', () => ({
    GeminiClient: function () {
        return {
            generateContent: vi.fn(),
        };
    },
}));

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
    w: vi.fn(),
    e: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/core.js', () => ({
    jp: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/string.js', () => ({
    rp: vi.fn(),
    trm: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/network.js', () => ({
    ft: vi.fn(),
}));

import { handleTranscribeAudio } from '../../../extension/background/handlers/transcribe-audio.js';

describe('handleTranscribeAudio', () => {
    let mockGeminiClient, mockW, mockE, mockJp, mockRp, mockTrm, mockSg, mockFt, mockRsp;

    beforeEach(() => {
        vi.clearAllMocks();
        mockGeminiClient = vi.mocked(require('../../../extension/api/gemini-client.js').GeminiClient);
        mockW = vi.mocked(require('../../../extension/utils/shortcuts/log.js').w);
        mockE = vi.mocked(require('../../../extension/utils/shortcuts/log.js').e);
        mockJp = vi.mocked(require('../../../extension/utils/shortcuts/core.js').jp);
        mockRp = vi.mocked(require('../../../extension/utils/shortcuts/string.js').rp);
        mockTrm = vi.mocked(require('../../../extension/utils/shortcuts/string.js').trm);
        mockSg = vi.mocked(require('../../../extension/utils/shortcuts/storage.js').sg);
        mockFt = vi.mocked(require('../../../extension/utils/shortcuts/network.js').ft);
        mockRsp = vi.fn();

        // Setup mocks
        mockRp.mockImplementation((str, regex, repl) => str.replace(regex, repl));
        mockTrm.mockImplementation(s => s.trim());
        mockJp.mockImplementation(JSON.parse);
    });

    it('should transcribe audio successfully', async () => {
        const req = { audioUrl: 'http://audio.mp4', lang: 'en' };
        mockSg.mockResolvedValue({ apiKey: 'key', model: 'gemini-2.5' });
        mockFt.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        });
        const mockClient = {
            generateContent: vi.fn().mockResolvedValue('[{"start": 0, "text": "Hello"}]'),
        };
        mockGeminiClient.mockReturnValue(mockClient);
        mockJp.mockReturnValue([{ start: 0, text: 'Hello' }]);

        await handleTranscribeAudio(req, mockRsp);

        expect(mockClient.generateContent).toHaveBeenCalled();
        expect(mockRsp).toHaveBeenCalledWith({
            success: true,
            segments: [{ start: 0, text: 'Hello' }],
        });
    });

    it('should handle no audioUrl', async () => {
        const req = {};
        mockSg.mockResolvedValue({ apiKey: 'key' });

        await handleTranscribeAudio(req, mockRsp);

        expect(mockE).toHaveBeenCalledWith('[TranscribeAudio] Error:', expect.any(Error));
        expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'No audio URL provided' });
    });

    it('should handle no apiKey', async () => {
        const req = { audioUrl: 'url' };
        mockSg.mockResolvedValue({});

        await handleTranscribeAudio(req, mockRsp);

        expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'Gemini API key not found' });
    });

    it('should handle fetch failure', async () => {
        const req = { audioUrl: 'url' };
        mockSg.mockResolvedValue({ apiKey: 'key' });
        mockFt.mockResolvedValueOnce({ ok: false, status: 404 });

        await handleTranscribeAudio(req, mockRsp);

        expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'Failed to fetch audio: 404' });
    });

    it('should handle JSON parse failure and extract array', async () => {
        const req = { audioUrl: 'url' };
        mockSg.mockResolvedValue({ apiKey: 'key' });
        mockFt.mockResolvedValueOnce({
            ok: true,
            arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
        });
        const mockClient = {
            generateContent: vi.fn().mockResolvedValue('Some text [{"start": 1}] more'),
        };
        mockGeminiClient.mockReturnValue(mockClient);
        mockJp.mockImplementationOnce(() => {
            throw new Error('Parse error');
        });
        mockJp.mockImplementationOnce(() => [{ start: 1 }]);

        await handleTranscribeAudio(req, mockRsp);

        expect(mockW).toHaveBeenCalled();
        expect(mockRsp).toHaveBeenCalledWith({ success: true, segments: [{ start: 1 }] });
    });
});
