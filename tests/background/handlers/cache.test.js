// Mocks
vi.mock('../../../extension/background/services.js', () => ({
  initializeServices: vi.fn(),
  getServices: vi.fn(),
}));

vi.mock('../../../extension/background/utils/api-key.js', () => ({
  getApiKey: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

import { initializeServices, getServices } from '../../../extension/background/services.js';
import { getApiKey } from '../../../extension/background/utils/api-key.js';
import { e } from '../../../extension/utils/shortcuts/log.js';
import { handleGetCachedData } from '../../../extension/background/handlers/cache.js';

describe('handleGetCachedData', () => {
  let mockInitializeServices, mockGetServices, mockGetApiKey, mockE, mockStorage, mockRsp;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeServices = initializeServices;
    mockGetServices = getServices;
    mockGetApiKey = getApiKey;
    mockE = e;
    mockStorage = { getVideoData: vi.fn() };
    mockGetServices.mockReturnValue({ storage: mockStorage });
    mockRsp = vi.fn();
  });

  it('should return cached data successfully', async () => {
    const req = { videoId: 'vid1' };
    const mockData = { summary: 'test' };
    mockGetApiKey.mockResolvedValue('key');
    mockInitializeServices.mockResolvedValue();
    mockStorage.getVideoData.mockResolvedValue(mockData);

    await handleGetCachedData(req, mockRsp);

    expect(mockGetApiKey).toHaveBeenCalled();
    expect(mockInitializeServices).toHaveBeenCalledWith('key');
    expect(mockStorage.getVideoData).toHaveBeenCalledWith('vid1');
    expect(mockRsp).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  it('should handle no apiKey', async () => {
    const req = { videoId: 'vid1' };
    mockGetApiKey.mockResolvedValue(null);
    mockGetServices.mockReturnValue({ storage: null });

    await handleGetCachedData(req, mockRsp);

    expect(mockRsp).toHaveBeenCalledWith({ success: false });
  });

  it('should handle no storage', async () => {
    const req = { videoId: 'vid1' };
    mockGetApiKey.mockResolvedValue('key');
    mockInitializeServices.mockResolvedValue();
    mockGetServices.mockReturnValue({ storage: null });

    await handleGetCachedData(req, mockRsp);

    expect(mockRsp).toHaveBeenCalledWith({ success: false });
  });

  it('should handle error', async () => {
    const req = { videoId: 'vid1' };
    mockGetApiKey.mockResolvedValue('key');
    mockInitializeServices.mockResolvedValue();
    mockStorage.getVideoData.mockRejectedValue(new Error('DB error'));

    await handleGetCachedData(req, mockRsp);

    expect(mockE).toHaveBeenCalledWith('GetCached:', expect.any(Error));
    expect(mockRsp).toHaveBeenCalledWith({ success: false, error: 'DB error' });
  });
});
