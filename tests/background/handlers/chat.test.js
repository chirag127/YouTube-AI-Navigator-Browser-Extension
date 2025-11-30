// Mocks
vi.mock('../../../extension/background/services.js', () => ({
  initializeServices: vi.fn(),
  getServices: vi.fn(),
}));

vi.mock('../../../extension/background/utils/api-key.js', () => ({
  getApiKey: vi.fn(),
}));

import { initializeServices, getServices } from '../../../extension/background/services.js';
import { getApiKey } from '../../../extension/background/utils/api-key.js';
import { handleChatWithVideo } from '../../../extension/background/handlers/chat.js';

describe('handleChatWithVideo', () => {
  let mockInitializeServices, mockGetServices, mockGetApiKey, mockGemini, mockRsp;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeServices = initializeServices;
    mockGetServices = getServices;
    mockGetApiKey = getApiKey;
    mockGemini = { chatWithVideo: vi.fn() };
    mockGetServices.mockReturnValue({ gemini: mockGemini });
    mockRsp = vi.fn();
  });

  it('should chat with video successfully', async () => {
    const req = {
      question: 'What is this?',
      context: 'transcript',
      metadata: { title: 'Test', author: 'Channel' },
    };
    mockGetApiKey.mockResolvedValue('key');
    mockInitializeServices.mockResolvedValue();
    mockGemini.chatWithVideo.mockResolvedValue('Answer');

    await handleChatWithVideo(req, mockRsp);

    expect(mockGemini.chatWithVideo).toHaveBeenCalledWith(
      'What is this?',
      expect.stringContaining('Test'),
      null
    );
    expect(mockRsp).toHaveBeenCalledWith({ success: true, answer: 'Answer' });
  });

  it('should handle no apiKey', async () => {
    const req = { question: 'Q', context: 'ctx', metadata: {} };
    mockGetApiKey.mockResolvedValue(null);

    await handleChatWithVideo(req, mockRsp);

    expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'API Key not configured' });
  });

  it('should handle error', async () => {
    const req = { question: 'Q', context: 'ctx', metadata: {} };
    mockGetApiKey.mockResolvedValue('key');
    mockInitializeServices.mockResolvedValue();
    mockGemini.chatWithVideo.mockRejectedValue(new Error('Chat failed'));

    await handleChatWithVideo(req, mockRsp);

    expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'Chat failed' });
  });
});
