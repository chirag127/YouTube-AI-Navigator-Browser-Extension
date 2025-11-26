/**
 * Service to classify transcript segments using AI.
 */
export class SegmentClassificationService {
  /**
   * @param {import('./GeminiService.js').GeminiService} geminiService
   * @param {import('./ChunkingService.js').ChunkingService} chunkingService
   */
  constructor(geminiService, chunkingService) {
    this.geminiService = geminiService
    this.chunkingService = chunkingService
  }

  /**
   * Classifies the transcript into segments (Sponsor, Content, etc.).
   * @param {Array<{text: string, start: number, duration: number}>} transcript
   * @returns {Promise<Array<{text: string, start: number, end: number, label: string}>>}
   */
  async classifyTranscript(transcript) {
    if (!transcript || transcript.length === 0) return []

    // 1. Chunk the transcript into manageable pieces
    const chunks = this.chunkingService.chunkSegments(transcript)
    const classifiedChunks = []

    // 2. Classify each chunk
    // Note: In a real app, we might want to run these in parallel with a concurrency limit
    // to speed it up, but for now sequential is safer for rate limits.
    for (const chunk of chunks) {
      try {
        const label = await this.geminiService.classifySegments(chunk.text)
        classifiedChunks.push({
          ...chunk,
          label: label.trim(),
        })
      } catch (error) {
        console.error('Error classifying chunk:', error)
        // Fallback label or skip
        classifiedChunks.push({
          ...chunk,
          label: 'Unknown',
        })
      }
    }

    return classifiedChunks
  }
}
