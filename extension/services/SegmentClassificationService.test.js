import { SegmentClassificationService } from './SegmentClassificationService.js'

describe('SegmentClassificationService', () => {
  let service
  let mockGeminiService
  let mockChunkingService

  beforeEach(() => {
    mockGeminiService = {
      classifySegments: vi.fn(),
    }
    mockChunkingService = {
      chunkSegments: vi.fn(),
    }
    service = new SegmentClassificationService(mockGeminiService, mockChunkingService)
  })

  test('should classify transcript chunks', async () => {
    const transcript = [{ text: 'Sponsor segment', start: 0, duration: 10 }]
    const chunks = [{ text: 'Sponsor segment', start: 0, end: 10 }]

    mockChunkingService.chunkSegments.mockReturnValue(chunks)
    mockGeminiService.classifySegments.mockResolvedValue('Sponsor')

    const result = await service.classifyTranscript(transcript)

    expect(mockChunkingService.chunkSegments).toHaveBeenCalledWith(transcript)
    expect(mockGeminiService.classifySegments).toHaveBeenCalledWith('Sponsor segment')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      text: 'Sponsor segment',
      start: 0,
      end: 10,
      label: 'Sponsor',
    })
  })

  test('should handle classification errors gracefully', async () => {
    const transcript = [{ text: 'Content', start: 0, duration: 10 }]
    const chunks = [{ text: 'Content', start: 0, end: 10 }]

    mockChunkingService.chunkSegments.mockReturnValue(chunks)
    mockGeminiService.classifySegments.mockRejectedValue(new Error('API Error'))

    const result = await service.classifyTranscript(transcript)

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Unknown')
  })
})
