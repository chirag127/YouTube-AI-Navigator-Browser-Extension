import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService, ModelManager } from '../../extension/api/gemini.js';

vi.mock('../../extension/api/gemini-client.js', () => ({
    GeminiClient: function () {
        return {
            generateContent: vi.fn(),
            getRateLimitStats: vi.fn().mockReturnValue({}),
        };
    },
}));

vi.mock('../../extension/api/models.js', () => ({
    ModelManager: function () {
        return {
            fetch: vi.fn(),
            getList: vi.fn().mockReturnValue(['model1']),
            models: [],
        };
    },
}));

vi.mock('../../extension/api/prompts/index.js', () => ({
    prompts: {
        chat: vi.fn(),
        comments: vi.fn(),
        comprehensive: vi.fn(),
        segments: vi.fn(),
    },
}));

vi.mock('../../extension/api/utils/response-parser.js', () => ({
    extractSection: vi.fn(),
    extractTimestamps: vi.fn(),
    parseSegmentsJSON: vi.fn(),
    expandLabel: vi.fn(),
    transformSegments: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    w: vi.fn(),
    e: vi.fn(),
}));

describe('GeminiService', () => {
    let service;
    let mockClient;
    let mockModels;
    let mockPrompts;
    let mockParser;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new GeminiService('test-key');
        mockClient = service.client;
        mockModels = service.models;
        mockPrompts = require('../../extension/api/prompts/index.js').prompts;
        mockParser = require('../../extension/api/utils/response-parser.js');
    });

    describe('constructor', () => {
        it('should initialize client and models', () => {
            expect(service.client).toBeDefined();
            expect(service.models).toBeDefined();
        });
    });

    describe('fetchAvailableModels', () => {
        it('should fetch models', async () => {
            const models = ['model1'];
            mockModels.fetch.mockResolvedValue(models);

            const result = await service.fetchAvailableModels();

            expect(result).toEqual(models);
        });
    });

    describe('chatWithVideo', () => {
        it('should generate chat response', async () => {
            const prompt = 'chat prompt';
            const response = 'response';
            mockPrompts.chat.mockResolvedValue(prompt);
            mockClient.generateContent.mockResolvedValue(response);

            const result = await service.chatWithVideo('question', 'transcript');

            expect(mockPrompts.chat).toHaveBeenCalledWith('question', {
                transcript: 'transcript',
                metadata: {},
                comments: [],
                lyrics: null,
                sponsorBlockSegments: [],
            });
            expect(mockClient.generateContent).toHaveBeenCalledWith(prompt, null);
            expect(result).toBe(response);
        });
    });

    describe('analyzeCommentSentiment', () => {
        it('should analyze comments', async () => {
            const comments = ['comment1'];
            const prompt = 'analysis prompt';
            const response = 'analysis';
            mockPrompts.comments.mockResolvedValue(prompt);
            mockClient.generateContent.mockResolvedValue(response);

            const result = await service.analyzeCommentSentiment(comments);

            expect(result).toBe(response);
        });

        it('should return message for no comments', async () => {
            const result = await service.analyzeCommentSentiment([]);

            expect(result).toBe('No comments available to analyze.');
        });
    });

    describe('generateComprehensiveAnalysis', () => {
        it('should generate analysis', async () => {
            const ctx = { transcript: 'test' };
            const prompt = 'comp prompt';
            const response = 'full response';
            mockPrompts.comprehensive.mockResolvedValue(prompt);
            mockClient.generateContent.mockResolvedValue(response);
            mockParser.extractSection.mockImplementation((text, section) => `${section} content`);
            mockParser.extractTimestamps.mockReturnValue([]);

            const result = await service.generateComprehensiveAnalysis(ctx);

            expect(result).toEqual({
                summary: 'Summary content',
                insights: 'Key Insights content',
                faq: 'FAQ content',
                timestamps: [],
            });
        });

        it('should handle failure', async () => {
            mockPrompts.comprehensive.mockRejectedValue(new Error('error'));

            await expect(service.generateComprehensiveAnalysis({})).rejects.toThrow('error');
        });
    });

    describe('extractSegments', () => {
        it('should extract segments', async () => {
            const ctx = {};
            const prompt = 'seg prompt';
            const response = 'json response';
            const parsed = { segments: [], fullVideoLabel: 'label' };
            mockPrompts.segments.mockResolvedValue(prompt);
            mockClient.generateContent.mockResolvedValue(response);
            mockParser.parseSegmentsJSON.mockReturnValue(parsed);
            mockParser.expandLabel.mockReturnValue('expanded');
            mockParser.transformSegments.mockReturnValue([]);

            const result = await service.extractSegments(ctx);

            expect(result).toEqual({
                segments: [],
                fullVideoLabel: 'expanded',
            });
        });

        it('should return empty on parse failure', async () => {
            mockPrompts.segments.mockResolvedValue('prompt');
            mockClient.generateContent.mockResolvedValue('response');
            mockParser.parseSegmentsJSON.mockReturnValue(null);

            const result = await service.extractSegments({});

            expect(result).toEqual({ segments: [], fullVideoLabel: null });
        });

        it('should handle error', async () => {
            mockPrompts.segments.mockRejectedValue(new Error('error'));

            const result = await service.extractSegments({});

            expect(result).toEqual({ segments: [], fullVideoLabel: null });
        });
    });

    describe('generateContent', () => {
        it('should generate with specified model', async () => {
            mockClient.generateContent.mockResolvedValue('response');

            const result = await service.generateContent('prompt', 'model1');

            expect(mockClient.generateContent).toHaveBeenCalledWith('prompt', 'model1');
            expect(result).toBe('response');
        });

        it('should try multiple models on failure', async () => {
            mockClient.generateContent
                .mockRejectedValueOnce(new Error('fail1'))
                .mockResolvedValueOnce('response');
            mockModels.models = ['model1', 'model2'];

            const result = await service.generateContent('prompt');

            expect(mockClient.generateContent).toHaveBeenCalledTimes(2);
            expect(result).toBe('response');
        });

        it('should throw on all failures', async () => {
            mockClient.generateContent.mockRejectedValue(new Error('fail'));
            mockModels.models = ['model1'];

            await expect(service.generateContent('prompt')).rejects.toThrow('All 1 failed');
        });
    });

    describe('getRateLimitStats', () => {
        it('should return stats', () => {
            const stats = { test: 'stats' };
            mockClient.getRateLimitStats.mockReturnValue(stats);

            const result = service.getRateLimitStats();

            expect(result).toEqual(stats);
        });
    });
});
