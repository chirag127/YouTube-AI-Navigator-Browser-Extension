import { StorageService } from './StorageService.js'

// Mock chrome.storage.local
const mockStorage = {
  data: {},
  get: vi.fn((keys) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: mockStorage.data[keys] })
    }
    return Promise.resolve(mockStorage.data)
  }),
  set: vi.fn((items) => {
    Object.assign(mockStorage.data, items)
    return Promise.resolve()
  }),
  remove: vi.fn((key) => {
    delete mockStorage.data[key]
    return Promise.resolve()
  }),
}

global.chrome = {
  storage: {
    local: mockStorage,
  },
}

describe('StorageService', () => {
  let service

  beforeEach(() => {
    service = new StorageService()
    mockStorage.data = {}
    mockStorage.get.mockClear()
    mockStorage.set.mockClear()
    mockStorage.remove.mockClear()
  })

  test('should save transcript and update index', async () => {
    const videoId = 'vid1'
    const metadata = { title: 'Test Video', author: 'Me' }
    const transcript = [{ text: 'Hello' }]

    await service.saveTranscript(videoId, metadata, transcript)

    expect(mockStorage.set).toHaveBeenCalledTimes(2) // Once for data, once for index
    expect(mockStorage.data[`video_${videoId}`]).toBeDefined()
    expect(mockStorage.data[`video_${videoId}`].metadata.title).toBe('Test Video')

    const index = mockStorage.data.history_index
    expect(index).toHaveLength(1)
    expect(index[0].videoId).toBe(videoId)
  })

  test('should retrieve transcript', async () => {
    const videoId = 'vid1'
    const data = { videoId, text: 'Stored' }
    mockStorage.data[`video_${videoId}`] = data

    const result = await service.getTranscript(videoId)
    expect(result).toEqual(data)
  })

  test('should search history', async () => {
    mockStorage.data.history_index = [
      { videoId: '1', title: 'React Tutorial', author: 'User A' },
      { videoId: '2', title: 'Cooking 101', author: 'User B' },
    ]

    const results = await service.searchHistory('React')
    expect(results).toHaveLength(1)
    expect(results[0].videoId).toBe('1')
  })

  test('should delete video', async () => {
    const videoId = 'vid1'
    mockStorage.data[`video_${videoId}`] = { some: 'data' }
    mockStorage.data.history_index = [{ videoId, title: 'Test' }]

    await service.deleteVideo(videoId)

    expect(mockStorage.data[`video_${videoId}`]).toBeUndefined()
    expect(mockStorage.data.history_index).toHaveLength(0)
  })
})
