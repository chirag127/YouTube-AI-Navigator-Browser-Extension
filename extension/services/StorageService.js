/**
 * Service to manage persistent storage using chrome.storage.local.
 */
export class StorageService {
  constructor() {
    this.storage = chrome.storage.local
  }

  /**
   * Saves a transcript and its metadata.
   * @param {string} videoId
   * @param {Object} metadata - { title, author, duration, etc. }
   * @param {Array} transcript - Array of segments
   * @param {string} [summary] - Optional summary
   * @returns {Promise<void>}
   */
  async saveTranscript(videoId, metadata, transcript, summary = null) {
    if (!videoId) throw new Error('Video ID is required')

    const data = {
      videoId,
      metadata,
      transcript,
      summary,
      timestamp: Date.now(),
    }

    // We store each video under a unique key to avoid hitting the single item size limit if possible,
    // though chrome.storage.local has a large quota (5MB default, unlimited with permission).
    // Key format: "video_{videoId}"
    const key = `video_${videoId}`

    await this.storage.set({ [key]: data })

    // Also update a separate index of saved videos for quick listing
    await this._updateIndex(videoId, metadata)
  }

  /**
   * Retrieves a saved transcript by video ID.
   * @param {string} videoId
   * @returns {Promise<Object|null>}
   */
  async getTranscript(videoId) {
    if (!videoId) throw new Error('Video ID is required')
    const key = `video_${videoId}`
    const result = await this.storage.get(key)
    return result[key] || null
  }

  /**
   * Retrieves the history index (list of saved videos).
   * @returns {Promise<Array<{videoId: string, title: string, timestamp: number}>>}
   */
  async getHistory() {
    const result = await this.storage.get('history_index')
    return result.history_index || []
  }

  /**
   * Searches the history for videos matching the query (title or transcript content).
   * Note: Full transcript search might be slow if done this way.
   * For now, we'll search titles from the index, and maybe summary if we cache it in index.
   * @param {string} query
   * @returns {Promise<Array>}
   */
  async searchHistory(query) {
    if (!query) return this.getHistory()

    const index = await this.getHistory()
    const lowerQuery = query.toLowerCase()

    return index.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.author?.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Internal method to update the history index.
   * @param {string} videoId
   * @param {Object} metadata
   */
  async _updateIndex(videoId, metadata) {
    const index = await this.getHistory()

    // Remove existing entry for this video if any
    const newIndex = index.filter((item) => item.videoId !== videoId)

    // Add new entry to the top
    newIndex.unshift({
      videoId,
      title: metadata.title,
      author: metadata.author,
      timestamp: Date.now(),
    })

    await this.storage.set({ history_index: newIndex })
  }

  /**
   * Deletes a video from storage.
   * @param {string} videoId
   */
  async deleteVideo(videoId) {
    if (!videoId) return

    const key = `video_${videoId}`
    await this.storage.remove(key)

    const index = await this.getHistory()
    const newIndex = index.filter((item) => item.videoId !== videoId)
    await this.storage.set({ history_index: newIndex })
  }
}
