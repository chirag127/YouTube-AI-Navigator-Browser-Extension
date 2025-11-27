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

    // 1. Format transcript with timestamps for Gemini
    // We'll take chunks of the transcript to avoid token limits, but larger chunks than before.
    // For now, let's try to send the whole thing if it fits, or chunk it by 10 mins.
    // A 10 min video is roughly 1500 words ~ 2000 tokens. Gemini 1.5 Flash has 1M context.
    // We can safely send the whole transcript for most videos (up to several hours).

    const formattedTranscript = transcript
      .map((t) => `[${t.start.toFixed(1)}] ${t.text}`)
      .join('\n')

    console.log('Sending transcript to Gemini for segmentation...')

    try {
      // 2. Call Gemini to extract segments
      const extractedSegments = await this.geminiService.extractSegments(formattedTranscript)

      // 3. Process and fill gaps with "Content"
      return this._fillContentGaps(extractedSegments, transcript)
    } catch (error) {
      console.error('Error classifying transcript:', error)
      return []
    }
  }

  /**
   * Fills the gaps between classified segments with "Content" label.
   * @param {Array<{label: string, start: number, end: number}>} classifiedSegments
   * @param {Array<{start: number, duration: number}>} originalTranscript
   */
  _fillContentGaps(classifiedSegments, originalTranscript) {
    if (!originalTranscript.length) return []

    const videoEnd =
      originalTranscript[originalTranscript.length - 1].start +
      originalTranscript[originalTranscript.length - 1].duration

    // Sort segments by start time
    const sorted = classifiedSegments.sort((a, b) => a.start - b.start)

    const finalSegments = []
    let currentTime = 0

    for (const segment of sorted) {
      // If there is a gap before this segment, fill it with Content
      if (segment.start > currentTime + 1) {
        // 1 second tolerance
        finalSegments.push({
          label: 'Content',
          start: currentTime,
          end: segment.start,
          text: 'Main Content',
        })
      }

      // Add the classified segment
      finalSegments.push({
        ...segment,
        text: segment.description || segment.label,
      })

      currentTime = Math.max(currentTime, segment.end)
    }

    // Fill remaining time
    if (currentTime < videoEnd - 1) {
      finalSegments.push({
        label: 'Content',
        start: currentTime,
        end: videoEnd,
        text: 'Main Content',
      })
    }

    return finalSegments
  }
}
