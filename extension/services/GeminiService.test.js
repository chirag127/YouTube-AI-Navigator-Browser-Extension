import { GeminiService } from './GeminiService.js'

global.fetch = vi.fn()

describe('GeminiService', () => {
  let service
  const mockApiKey = 'test-api-key'

  beforeEach(() => {
    service = new GeminiService(mockApiKey)
    fetch.mockClear()
  })

  test('should throw error if API key is missing', async () => {
    const noKeyService = new GeminiService(null)
    await expect(noKeyService.fetchAvailableModels()).rejects.toThrow('API Key is required')
  })

  test('should fetch and sort models correctly', async () => {
    const mockModelsResponse = {
      models: [
        {
          name: 'models/gemini-small',
          supportedGenerationMethods: ['generateContent'],
          inputTokenLimit: 1000,
          outputTokenLimit: 500,
        },
        {
          name: 'models/gemini-large',
          supportedGenerationMethods: ['generateContent'],
          inputTokenLimit: 2000,
          outputTokenLimit: 1000,
        },
        {
          name: 'models/gemini-medium',
          supportedGenerationMethods: ['generateContent'],
          inputTokenLimit: 1000,
          outputTokenLimit: 2000,
        }, // Higher output than small
        {
          name: 'models/embedding-001',
          supportedGenerationMethods: ['embedContent'],
        }, // Should be filtered out
      ],
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockModelsResponse),
    })

    const models = await service.fetchAvailableModels()

    expect(models).toHaveLength(3)
    // Order: Large (2000 in) -> Medium (1000 in, 2000 out) -> Small (1000 in, 500 out)
    expect(models[0].name).toBe('models/gemini-large')
    expect(models[1].name).toBe('models/gemini-medium')
    expect(models[2].name).toBe('models/gemini-small')

    expect(service.selectedModel).toBe('gemini-large')
  })

  test('should use selected model for generation', async () => {
    // Setup selected model
    service.selectedModel = 'gemini-custom'

    const mockResponse = {
      candidates: [
        {
          content: { parts: [{ text: 'Result' }] },
        },
      ],
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await service.generateSummary('text')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models/gemini-custom:generateContent'),
      expect.anything()
    )
  })

  test('should incorporate customization options into prompt', async () => {
    const mockResponse = {
      candidates: [{ content: { parts: [{ text: 'Summary' }] } }],
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await service.generateSummary('transcript text', undefined, null, {
      length: 'Short',
      language: 'Spanish',
    })

    // Check if the prompt sent in the payload contains our instructions
    const callArgs = fetch.mock.calls[0]
    const payload = JSON.parse(callArgs[1].body)
    const promptText = payload.contents[0].parts[0].text

    expect(promptText).toContain('Target Language: Spanish')
    expect(promptText).toContain('approx. 100 words')
  })
})
