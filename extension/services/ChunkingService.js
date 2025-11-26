/**
 * Service to split text into manageable chunks.
 */
export class ChunkingService {
  constructor() {
    // Default max characters per chunk (approx 8000 tokens * 4 chars/token = 32000 chars)
    // Being conservative with 20000 chars to allow for prompt overhead and response.
    this.defaultChunkSize = 20000
    this.defaultOverlap = 500
  }

  /**
   * Splits text into chunks.
   * @param {string} text - The text to split.
   * @param {number} [chunkSize] - Max characters per chunk.
   * @param {number} [overlap] - Overlap between chunks.
   * @returns {string[]} - Array of text chunks.
   */
  chunkText(text, chunkSize = this.defaultChunkSize, overlap = this.defaultOverlap) {
    if (!text) return []
    if (text.length <= chunkSize) return [text]

    const chunks = []
    let startIndex = 0

    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize

      if (endIndex < text.length) {
        // Try to find a sentence break or space to avoid cutting words
        const lastSpace = text.lastIndexOf(' ', endIndex)
        const lastPeriod = text.lastIndexOf('.', endIndex)

        // Prefer period if it's close to the end (within last 50% of chunk)
        if (lastPeriod > startIndex + chunkSize * 0.5) {
          endIndex = lastPeriod + 1
        } else if (lastSpace > startIndex) {
          endIndex = lastSpace + 1
        }
      }

      const chunk = text.substring(startIndex, endIndex).trim()
      if (chunk) {
        chunks.push(chunk)
      }

      startIndex = endIndex - overlap

      // Prevent infinite loop if overlap is too big or logic fails
      if (startIndex >= endIndex) {
        startIndex = endIndex
      }
    }

    return chunks
  }

  /**
   * Chunks transcript segments while preserving timestamp information.
   * @param {Array<{text: string, start: number, duration: number}>} segments
   * @param {number} [chunkSize]
   * @returns {Array<{text: string, start: number, end: number}>}
   */
  chunkSegments(segments, chunkSize = this.defaultChunkSize) {
    if (!segments || segments.length === 0) return []

    const chunks = []
    let currentChunk = {
      text: '',
      start: segments[0].start,
      end: segments[0].start + segments[0].duration,
    }

    for (const segment of segments) {
      // If adding this segment exceeds chunk size, push current and start new
      if (
        currentChunk.text.length + segment.text.length > chunkSize &&
        currentChunk.text.length > 0
      ) {
        chunks.push(currentChunk)
        currentChunk = {
          text: '',
          start: segment.start,
          end: segment.start + segment.duration,
        }
      }

      // Append text
      currentChunk.text += (currentChunk.text ? ' ' : '') + segment.text
      // Update end time
      currentChunk.end = segment.start + segment.duration
    }

    // Push last chunk
    if (currentChunk.text.length > 0) {
      chunks.push(currentChunk)
    }

    return chunks
  }
}
