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
        const text = await response.text()
        let errorMsg = response.statusText
        try {
          const errorData = JSON.parse(text)
          errorMsg = errorData.error?.message || errorMsg
        } catch (e) {
          /* ignore */
        }
        throw new Error(`Gemini API Error (List Models): ${errorMsg}`)
      }

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        throw new Error('Failed to parse models list JSON')
      }
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
   * Extracts classified segments from the transcript with timestamps.
   * @param {string} text - The transcript text with timestamp markers (e.g. "[12.5] Hello world").
   * @param {string} [model]
   * @returns {Promise<Array<{label: string, start: number, end: number, description: string}>>}
   */
  async extractSegments(text, model = null) {
    const prompt = `
      Analyze the following video transcript and identify segments that fall into these categories:
      1. Sponsor (Paid promotions)
      2. Interaction Reminder (Like/Subscribe calls)
      3. Self Promotion (Merch/Services)
      4. Unpaid Promotion (Shout-outs)
      5. Highlight (Key moments)
      6. Preview/Recap
      7. Hook/Greetings (Intro)
      8. Tangents/Jokes (Off-topic)

      Return a JSON array of objects with these properties:
      - label: One of the categories above.
      - start: Start time in seconds (number).
      - end: End time in seconds (number).
      - description: Brief description of the segment content.

      Only include segments that clearly fit these categories. Do NOT include "Content" segments.
      The transcript is provided with timestamp markers in brackets like [12.5]. Use these to determine start/end times.

      Required JSON Structure:
      [
        { "label": "Sponsor", "start": 10.5, "end": 45.2, "description": "Sponsor read for X" }
      ]
    `
    const fullPrompt = `${prompt}\n\nTranscript:\n${text}`

    try {
      const responseText = await this.generateContent(fullPrompt, model)
      const cleanJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanJson)
    } catch (error) {
      console.error('Segment extraction failed:', error)
      return []
    }
  }

  /**
   * Internal method to call Gemini API.
   * @param {string} prompt - The prompt to send.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The generated text.
   */
  /**
   * Generates a comprehensive analysis (Summary, FAQ, Insights) in a single call.
   * @param {string} text - The transcript text.
   * @param {Object} options - Options for summary length, language, etc.
   * @returns {Promise<Object>} - { summary, faq, insights }
   */
  async generateComprehensiveAnalysis(text, options = {}) {
    const { length = 'Medium', language = 'English' } = options

    let lengthInstruction = ''
    switch (length) {
      case 'Short':
        lengthInstruction = 'Short summary with bullet points (approx. 100 words)'
        break
      case 'Detailed':
        lengthInstruction = 'Comprehensive, detailed summary (approx. 600 words)'
        break
      default:
        lengthInstruction = 'Standard summary with paragraphs (approx. 300 words)'
        break
    }

    const prompt = `
      Analyze the following video transcript and provide a comprehensive output in JSON format.
      Target Language: ${language}

      Required JSON Structure:
      {
        "summary": "Markdown formatted summary. ${lengthInstruction}",
        "faq": "Markdown formatted list of 5 Frequently Asked Questions and answers",
        "insights": "Markdown formatted key insights, trends, or interesting points"
      }

      Transcript:
      ${text}
    `

    try {
      const responseText = await this.generateContent(prompt)
      // Clean up potential markdown code blocks in response
      const cleanJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanJson)
    } catch (error) {
      console.error('Comprehensive analysis failed, falling back to individual calls:', error)
      // Fallback to individual calls if JSON parsing fails or model refuses JSON
      const summary = await this.generateSummary(text, undefined, null, options)
      const faq = await this.generateFAQ(text)
      return { summary, faq, insights: 'Insights generation failed.' }
    }
  }

  /**
   * Internal method to call Gemini API with Fallback Logic.
   * @param {string} prompt - The prompt to send.
   * @param {string} [model] - Optional model name override.
   * @returns {Promise<string>} - The generated text.
   */
  async generateContent(prompt, model = null) {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }

    // If specific model requested, try only that.
    // If generic request (null), try list of available models in order.
    let modelsToTry = []
    if (model) {
      modelsToTry = [model]
    } else {
      // If we haven't fetched models yet, do it now
      if (this.models.length === 0) {
        try {
          await this.fetchAvailableModels()
        } catch (e) {
          // Fallback if list fails
          modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
        }
      }

      if (this.models.length > 0) {
        modelsToTry = this.models.map((m) => m.name.replace('models/', ''))
      } else if (modelsToTry.length === 0) {
        modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
      }
    }

    let lastError = null

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting generation with model: ${modelName}`)
        return await this._makeApiCall(prompt, modelName)
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message)
        lastError = error

        // If it's not a quota/rate limit error, maybe don't retry?
        // For now, we retry on everything to be safe, but we could filter.
        if (!error.message.includes('429') && !error.message.includes('Quota')) {
          // If it's a bad request (400), retrying might not help, but let's try next model anyway.
        }

        // Small delay before next retry
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    throw lastError || new Error('All models failed to generate content')
  }

  async _makeApiCall(prompt, modelName) {
    // Ensure model name doesn't have 'models/' prefix
    const cleanModelName = modelName.startsWith('models/')
      ? modelName.replace('models/', '')
      : modelName
    const url = `${this.baseUrl}/models/${cleanModelName}:generateContent?key=${this.apiKey}`

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      let errorMsg = response.statusText
      try {
        const errorData = JSON.parse(text)
        errorMsg = errorData.error?.message || errorMsg
      } catch (e) {
        /* ignore */
      }
      throw new Error(`Gemini API Error (${response.status}): ${errorMsg}`)
    }

    const text = await response.text()
    try {
      const data = JSON.parse(text)
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        throw new Error('No content generated')
      }

      return generatedText
    } catch (e) {
      throw new Error(`Failed to parse Gemini API response: ${e.message}`)
    }
  }
}
