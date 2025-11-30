import { describe, it, expect, beforeEach, vi, test } from 'vitest';
import { comments } from '../../../extension/api/prompts/comments.js';
import { sg } from '../../../extension/utils/shortcuts/storage.js';
import { detectSpam } from '../../../extension/utils/patterns/comments.js';

// Mock storage
vi.mock('../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(),
}));

// Mock utils
vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../extension/utils/patterns/comments.js', () => ({
  analyzeSentiment: vi.fn(() => 'positive'),
  detectSpam: vi.fn(() => false),
  isQuestion: vi.fn(() => false),
}));

describe('Comments Prompt Generator', () => {
  const mockComments = [
    { author: 'User1', text: 'Great video!', likes: 10 },
    { author: 'User2', text: 'Spam comment', likes: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return empty string for empty comment list', async () => {
    const result = await comments([]);
    expect(result).toBe('');
  });

  test('should respect spam filtering setting', async () => {
    sg.mockResolvedValue({
      config: {
        comments: { filterSpam: true },
        prompts: { comments: {} },
      },
    });

    detectSpam.mockImplementation(text => text === 'Spam comment');

    const result = await comments(mockComments);

    expect(result).toContain('Spam Filtered: 1');
    expect(result).not.toContain('User2: Spam comment');
  });

  test('should respect sentiment analysis setting', async () => {
    sg.mockResolvedValue({
      config: {
        comments: { analyzeSentiment: true },
        prompts: { comments: {} },
      },
    });

    const result = await comments(mockComments);

    expect(result).toContain('Sentiment Distribution');
    expect(result).toContain('[POSITIVE]');
  });

  test('should disable sentiment analysis when configured', async () => {
    sg.mockResolvedValue({
      config: {
        comments: { analyzeSentiment: false },
        prompts: { comments: {} },
      },
    });

    const result = await comments(mockComments);

    expect(result).toContain('Sentiment analysis disabled');
    expect(result).not.toContain('[POSITIVE]');
  });
});
