/**
 * Service to interact with Google Gemini API.
 */
export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.models = []
    this.selectedModel = null
  }

  /**
   * Fetches the list of available models from the API.
   * Sorts them by input token limit (desc), then output token limit (desc), then name.
   * @returns {Promise<Array<Object>>} - The sorted list of models.
   */
  async fetchAvailableModels() {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }

    const url = `${this.baseUrl}/models?key=${this.apiKey}&pageSize=100`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Gemini API Error (List Models): ${errorData.error?.message || response.statusText}`
        )
      }

      const data = await response.json()
      if (!data.models) {
        throw new Error('No models found in response')
      }

      // Filter for models that support 'generateContent'
      const contentModels = data.models.filter((m) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )

      // Sort models: Input Limit (desc) -> Output Limit (desc) -> Name (asc) -> API Order (implicit stability)
      this.models = contentModels.sort((a, b) => {
        const inputA = a.inputTokenLimit || 0
        const inputB = b.inputTokenLimit || 0
        if (inputB !== inputA) return inputB - inputA

        const outputA = a.outputTokenLimit || 0
        const outputB = b.outputTokenLimit || 0
        if (outputB !== outputA) return outputB - outputA

        return a.name.localeCompare(b.name)
      })

      // Select the best model (first in list) by default
      if (this.models.length > 0) {
        this.selectedModel = this.models[0].name.replace('models/', '')
      }

      return this.models
    } catch (error) {
      console.error('GeminiService fetchAvailableModels Error:', error)
      throw error
    }
  }

  /**
   * Generates a summary for the given text.
   * @param {string} text - The text to summarize.
   * @param {string} [prompt] - Custom prompt.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The summary.
   */
  /**
   * Generates a summary for the given text.
   * @param {string} text - The text to summarize.
   * @param {string} [prompt] - Custom prompt.
   * @param {string} [model] - Optional model name override.
   * @param {Object} [options] - Customization options { length: 'Short'|'Medium'|'Detailed', language: 'English'|... }
   * @returns {Promise<string>} - The summary.
   */
  async generateSummary(
    text,
    prompt = 'Summarize the following video transcript.',
    model = null,
    options = {}
  ) {
    const { length = 'Medium', language = 'English' } = options

    let lengthInstruction = ''
    switch (length) {
      case 'Short':
        lengthInstruction = 'Provide a short summary with bullet points (approx. 100 words).'
        break
      case 'Detailed':
        lengthInstruction = 'Provide a comprehensive, detailed summary (approx. 600 words).'
        break
      default:
        lengthInstruction = 'Provide a standard summary with paragraphs (approx. 300 words).'
        break
    }

    const fullPrompt = `${prompt}\n\nTarget Language: ${language}\nLength/Style: ${lengthInstruction}\n\nTranscript:\n${text}`
    return this.generateContent(fullPrompt, model)
  }

  /**
   * Classifies segments of the transcript.
   * @param {string} text - The transcript segment.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The classification result.
   */
  async classifySegments(text, model = null) {
    const prompt =
      'Analyze the following transcript segment and classify it into one of these categories: Sponsor, Interaction Reminder, Self Promotion, Unpaid Promotion, Highlight, Preview/Recap, Hook/Greetings, Tangents/Jokes, or Content. Return ONLY the category name.'
    const fullPrompt = `${prompt}\n\n${text}`
    return this.generateContent(fullPrompt, model)
  }

  /**
   * Chat with the video content.
   * @param {string} question - The user's question.
   * @param {string} context - The video context/transcript.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The answer.
   */
  async chatWithVideo(question, context, model = null) {
    const prompt = `You are a helpful assistant answering questions about a video. Use the following context to answer the question.\n\nContext:\n${context}\n\nQuestion: ${question}`
    return this.generateContent(prompt, model)
  }

  /**
   * Analyzes the sentiment of a list of comments.
   * @param {Array<string>} comments
   * @param {string} [model]
   * @returns {Promise<string>}
   */
  async analyzeCommentSentiment(comments, model = null) {
    if (!comments || comments.length === 0) return 'No comments available to analyze.'

    const commentsText = comments.map((c, i) => `${i + 1}. ${c}`).join('\n')
    const prompt = `Analyze the sentiment of these YouTube comments. Provide a summary of the general audience reaction, top recurring themes, and overall sentiment (Positive/Negative/Neutral).\n\nComments:\n${commentsText}`

    return this.generateContent(prompt, model)
  }

  /**
   * Generates FAQs based on the transcript.
   * @param {string} text - The transcript text.
   * @param {string} [model]
   * @returns {Promise<string>}
   */
  async generateFAQ(text, model = null) {
    const prompt =
      'Based on the following video transcript, generate a list of 5 Frequently Asked Questions (FAQs) and their answers. Format as a Markdown list.'
    const fullPrompt = `${prompt}\n\nTranscript:\n${text}`
    return this.generateContent(fullPrompt, model)
  }

  /**
   * Generates market analysis subtitles from transcript.
   * Extracts key market data points, trends, and insights with timestamps.
   * @param {string} text - The transcript text.
   * @param {string} [model]
   * @returns {Promise<string>}
   */
  async generateMarketSubtitles(text, model = null) {
    const prompt = `Analyze the following video transcript for market analysis content. If this appears to be a market/finance/investment video, extract key market data points, trends, stock mentions, economic indicators, and insights. Format as timestamped subtitles suitable for market analysis. If not market-related, return "Not applicable - video does not contain market analysis content."`
    const fullPrompt = `${prompt}\n\nTranscript:\n${text}`
    return this.generateContent(fullPrompt, model)
  }

  /**
   * Internal method to call Gemini API.
   * @param {string} prompt - The prompt to send.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The generated text.
   */
  async generateContent(prompt, model = null) {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }

    // Use provided model, or selected model, or fallback to gemini-pro
    let modelName = model || this.selectedModel || 'gemini-pro'

    // Ensure model name doesn't have 'models/' prefix for the URL construction if it was passed raw
    // But the API expects `models/{model}:generateContent` or just `{model}:generateContent`?
    // The list returns `models/gemini-pro`. The generate endpoint is `.../models/gemini-pro:generateContent`.
    // So if we stored 'gemini-pro' (stripped), we need to add 'models/' back or use the full name.
    // Let's standardize: `this.selectedModel` stores the short name.

    if (modelName.startsWith('models/')) {
      modelName = modelName.replace('models/', '')
    }

    const url = `${this.baseUrl}/models/${modelName}:generateContent?key=${this.apiKey}`

    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        throw new Error('No content generated')
      }

      return generatedText
    } catch (error) {
      console.error('GeminiService generateContent Error:', error)
      throw error
    }
  }
}
