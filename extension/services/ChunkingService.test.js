import { ChunkingService } from './ChunkingService.js'

describe('ChunkingService', () => {
  let service

  beforeEach(() => {
    service = new ChunkingService()
  })

  test('should return empty array for empty text', () => {
    expect(service.chunkText('')).toEqual([])
  })

  test('should return single chunk if text is smaller than chunkSize', () => {
    const text = 'Short text'
    expect(service.chunkText(text, 100)).toEqual([text])
  })

  test.skip('should split text into chunks', () => {
    const text = 'This is a long text that needs to be split into multiple chunks for processing.'
    const chunkSize = 20
    const overlap = 5

    const chunks = service.chunkText(text, chunkSize, overlap)

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0].length).toBeLessThanOrEqualTo(chunkSize)
  })

  test.skip('should respect sentence boundaries if possible', () => {
    const text = 'First sentence. Second sentence is longer.'
    const chunkSize = 25

    const chunks = service.chunkText(text, chunkSize, 0)

    // Should split roughly around the sentence
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]).toContain('First')
    expect(chunks[1]).toContain('Second')
  })

  test('should chunk segments and preserve timestamps', () => {
    const segments = [
      { text: 'Segment 1', start: 0, duration: 2 },
      { text: 'Segment 2', start: 2, duration: 2 },
      { text: 'Segment 3', start: 4, duration: 2 },
    ]
    // Force split after 2 segments (approx 18 chars)
    const chunkSize = 20

    const chunks = service.chunkSegments(segments, chunkSize)

    expect(chunks).toHaveLength(2)
    expect(chunks[0].text).toBe('Segment 1 Segment 2')
    expect(chunks[0].start).toBe(0)
    expect(chunks[0].end).toBe(4)

    expect(chunks[1].text).toBe('Segment 3')
    expect(chunks[1].start).toBe(4)
    expect(chunks[1].end).toBe(6)
  })
})
