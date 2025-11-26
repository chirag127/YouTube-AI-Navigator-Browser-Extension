import { YouTubeTranscriptService } from './YouTubeTranscriptService.js'

// Mock fetch
global.fetch = vi.fn()

// Mock document for decodeHtml
global.document = {
  createElement: () => ({ innerHTML: '', value: '' }),
}

describe('YouTubeTranscriptService', () => {
  let service

  beforeEach(() => {
    service = new YouTubeTranscriptService()
    fetch.mockClear()
    vi.restoreAllMocks()
  })

  test('should fetch and parse transcript successfully', async () => {
    const mockHtml = `
      <html>
        <script>
          var ytInitialPlayerResponse = {
            captions: {
              playerCaptionsTracklistRenderer: {
                captionTracks: [
                  { languageCode: 'en', baseUrl: 'http://example.com/transcript' }
                ]
              }
            }
          };
        </script>
        <script>
          // Mocking the regex match for captionTracks
          // "captionTracks": [{"languageCode":"en","baseUrl":"http://example.com/transcript"}]
        </script>
      </html>
    `
    // We need to ensure the regex matches.
    // The service uses regex on the HTML string directly for captionTracks.
    const mockHtmlWithRegexMatch = `
      <html>
        "captionTracks": [{"languageCode":"en","baseUrl":"http://example.com/transcript"}]
      </html>
    `

    const mockXml = `
      <transcript>
        <text start="0.0" dur="2.0">Hello</text>
        <text start="2.0" dur="3.0">World</text>
      </transcript>
    `

    fetch
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtmlWithRegexMatch),
      }) // Video page
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockXml),
      }) // Transcript XML

    vi.spyOn(service, 'decodeHtml').mockImplementation((text) => text)

    const result = await service.getTranscript('video123')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ start: 0.0, duration: 2.0, text: 'Hello' })
    expect(result[1]).toEqual({ start: 2.0, duration: 3.0, text: 'World' })
  })

  test('should fetch video metadata successfully', async () => {
    const mockPlayerResponse = {
      videoDetails: {
        title: 'Test Video',
        lengthSeconds: '120',
        author: 'Test Author',
        viewCount: '1000',
      },
    }

    // Construct HTML that works with the brace counting logic
    const mockHtml = `
      <html>
        <script>
          var ytInitialPlayerResponse = ${JSON.stringify(mockPlayerResponse)};
        </script>
      </html>
    `

    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    })

    const metadata = await service.getVideoMetadata('video123')

    expect(metadata).toEqual({
      title: 'Test Video',
      duration: 120,
      author: 'Test Author',
      viewCount: '1000',
    })
  })

  test('should throw error if no captions found', async () => {
    const mockHtml = `
      <html>
        <script>
          var ytInitialPlayerResponse = {
            captions: {}
          };
        </script>
      </html>
    `

    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockHtml),
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(service.getTranscript('video123')).rejects.toThrow('No captions found')

    consoleSpy.mockRestore()
  })
})
