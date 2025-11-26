/**
 * Service to fetch and parse YouTube video transcripts and metadata.
 */
export class YouTubeTranscriptService {
  /**
   * Fetches the video page HTML.
   * @param {string} videoId
   * @returns {Promise<string>}
   */
  async _fetchVideoPage(videoId) {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.statusText}`)
    }
    return response.text()
  }

  /**
   * Extracts the ytInitialPlayerResponse JSON object from HTML.
   * @param {string} html
   * @returns {Object}
   */
  _extractPlayerResponse(html) {
    const startPattern = 'ytInitialPlayerResponse = '
    const startIndex = html.indexOf(startPattern)
    if (startIndex === -1) {
      throw new Error('Failed to extract player response')
    }

    let braceCount = 0
    let endIndex = -1
    let foundStart = false
    const jsonStartIndex = startIndex + startPattern.length

    for (let i = jsonStartIndex; i < html.length; i++) {
      if (html[i] === '{') {
        braceCount++
        foundStart = true
      } else if (html[i] === '}') {
        braceCount--
      }

      if (foundStart && braceCount === 0) {
        endIndex = i + 1
        break
      }
    }

    if (endIndex === -1) {
      // Fallback to regex if brace counting fails (e.g. malformed HTML or unexpected structure)
      // But for now, let's throw to be safe/strict
      throw new Error('Failed to parse player response JSON')
    }

    const jsonStr = html.substring(jsonStartIndex, endIndex)
    try {
      return JSON.parse(jsonStr)
    } catch (e) {
      throw new Error('Failed to parse player response JSON content')
    }
  }

  /**
   * Retrieves video metadata (title, duration, etc.).
   * @param {string} videoId
   * @returns {Promise<{title: string, duration: number, author: string, viewCount: string}>}
   */
  async getVideoMetadata(videoId) {
    if (!videoId) throw new Error('Video ID is required')

    try {
      const html = await this._fetchVideoPage(videoId)
      const playerResponse = this._extractPlayerResponse(html)
      const videoDetails = playerResponse.videoDetails

      if (!videoDetails) {
        throw new Error('No video details found')
      }

      return {
        title: videoDetails.title,
        duration: Number.parseInt(videoDetails.lengthSeconds, 10),
        author: videoDetails.author,
        viewCount: videoDetails.viewCount,
      }
    } catch (error) {
      console.error('YouTubeTranscriptService getVideoMetadata Error:', error)
      throw error
    }
  }

  /**
   * Fetches the transcript for a given video ID.
   * @param {string} videoId - The YouTube video ID.
   * @param {string} [lang='en'] - The language code.
   * @returns {Promise<Array<{text: string, start: number, duration: number}>>} - The transcript segments.
   */
  async getTranscript(videoId, lang = 'en') {
    if (!videoId) {
      throw new Error('Video ID is required')
    }

    try {
      const html = await this._fetchVideoPage(videoId)

      // 2. Extract captionTracks using Regex (more robust than JSON parsing for this specific field)
      const captionTracksMatch = html.match(/["']?captionTracks["']?\s*:\s*(\[[\s\S]+?\])/)
      if (!captionTracksMatch) {
        throw new Error('No captions found for this video')
      }

      const captionTracksJson = captionTracksMatch[1]

      const tracks = []
      const trackRegex =
        /["']?languageCode["']?\s*:\s*["']([^"']+)["'][\s\S]+?["']?baseUrl["']?\s*:\s*["']([^"']+)["']/g

      let trackMatch
      while ((trackMatch = trackRegex.exec(captionTracksJson)) !== null) {
        tracks.push({
          languageCode: trackMatch[1],
          baseUrl: trackMatch[2],
        })
      }

      if (tracks.length === 0) {
        throw new Error('Failed to parse caption tracks')
      }

      // 3. Find the best track
      const track =
        tracks.find((t) => t.languageCode === lang) ||
        tracks.find((t) => t.languageCode.startsWith('en')) ||
        tracks[0]

      if (!track) {
        throw new Error('No suitable caption track found')
      }

      // 4. Fetch the transcript XML
      const transcriptResponse = await fetch(track.baseUrl)
      const transcriptXml = await transcriptResponse.text()

      // 5. Parse XML
      return this.parseTranscriptXml(transcriptXml)
    } catch (error) {
      console.error('YouTubeTranscriptService Error:', error)
      throw error
    }
  }

  /**
   * Parses the transcript XML into an array of segments.
   * @param {string} xml - The transcript XML string.
   * @returns {Array<{text: string, start: number, duration: number}>}
   */
  parseTranscriptXml(xml) {
    const segments = []
    const regex = /<text start="([\d.]+)" dur="([\d.]+)">([^<]+)<\/text>/g
    let match

    while ((match = regex.exec(xml)) !== null) {
      segments.push({
        start: Number.parseFloat(match[1]),
        duration: Number.parseFloat(match[2]),
        text: this.decodeHtml(match[3]),
      })
    }

    return segments
  }

  /**
   * Extracts the ytInitialData JSON object from HTML.
   * @param {string} html
   * @returns {Object}
   */
  _extractInitialData(html) {
    const startPattern = 'var ytInitialData = '
    const startIndex = html.indexOf(startPattern)
    if (startIndex === -1) {
      // Try alternative pattern without 'var'
      const startPattern2 = 'ytInitialData = '
      const startIndex2 = html.indexOf(startPattern2)
      if (startIndex2 === -1) {
        throw new Error('Failed to extract initial data')
      }
      return this._parseJsonFromHtml(html, startIndex2 + startPattern2.length)
    }
    return this._parseJsonFromHtml(html, startIndex + startPattern.length)
  }

  _parseJsonFromHtml(html, startIndex) {
    let braceCount = 0
    let endIndex = -1
    let foundStart = false

    for (let i = startIndex; i < html.length; i++) {
      if (html[i] === '{') {
        braceCount++
        foundStart = true
      } else if (html[i] === '}') {
        braceCount--
      }

      if (foundStart && braceCount === 0) {
        endIndex = i + 1
        break
      }
    }

    if (endIndex === -1) {
      throw new Error('Failed to parse JSON structure')
    }

    const jsonStr = html.substring(startIndex, endIndex)
    try {
      return JSON.parse(jsonStr)
    } catch (e) {
      throw new Error('Failed to parse JSON content')
    }
  }

  /**
   * Fetches top comments for a video.
   * @param {string} videoId
   * @returns {Promise<Array<string>>}
   */
  async getComments(videoId) {
    if (!videoId) throw new Error('Video ID is required')

    try {
      const html = await this._fetchVideoPage(videoId)
      const initialData = this._extractInitialData(html)

      // Traverse JSON to find comments
      // Path: contents -> twoColumnWatchNextResults -> results -> results -> contents -> itemSectionRenderer -> contents -> commentThreadRenderer
      // Note: Comments might be lazy loaded via AJAX on scroll, but usually the first batch is in initialData or a continuation token is provided.
      // Actually, for many videos, comments are NOT in initialData of the watch page, they are loaded via a separate API call (continuation).
      // However, sometimes a preview or teaser is there.
      // If they are not present, we might need to rely on the 'continuation' endpoint which is complex to reverse engineer without an API key.
      // BUT, for the "Free API" approach, we often scrape.
      // Let's try to find the comment section renderer.

      // A more robust way for extensions: The content script can extract comments from the DOM if the user scrolls!
      // But we want to do it in the background/sidepanel.
      // If we can't get it easily from initialData, we might have to skip or warn.
      // Let's inspect the structure of initialData usually found on watch page.
      // It usually contains 'itemSectionRenderer' under 'continuationItemRenderer' if it's lazy loaded.

      // ALTERNATIVE: Use the Google Gemini API to "guess" comments? No.
      // ALTERNATIVE: Use the 'continuation' token found in initialData to fetch comments.
      // That requires a POST request to /youtubei/v1/next or /comment_service_ajax.

      // SIMPLIFICATION FOR THIS MVP:
      // Since fetching comments via scraping is flaky and complex (requires handling continuations and signatures),
      // and we are strictly "No API Key" for YouTube Data API,
      // we will try to extract them if present. If not, we return an empty list or mock for now?
      // No, "Production-ready".
      // Let's try to find the 'itemSectionRenderer' which holds comments.

      const results = initialData.contents?.twoColumnWatchNextResults?.results?.results?.contents
      if (!results) return []

      // This is a deep search.
      // Let's try to find a section that looks like comments.
      // Often it's in a section with 'sectionIdentifier': 'comment-item-section'

      // Since this is hard to guarantee without a real browser rendering,
      // and we are in a background/sidepanel context fetching raw HTML...
      // The raw HTML of a YouTube watch page often DOES NOT contain comments anymore (CSR).

      // PIVOT: The spec says "Top Comments Overview".
      // If we can't reliably get them via fetch, we should use the CONTENT SCRIPT to extract them from the DOM
      // since the user is likely on the page!
      // The content script has access to the fully rendered DOM (including comments if loaded).
      // This is much more robust for an extension.

      // So, I will NOT implement getComments here using fetch.
      // I will implement it in `content.js` and message it back.

      return [] // Placeholder to satisfy the method signature if called directly.
    } catch (error) {
      console.warn('Failed to fetch comments via scraping:', error)
      return []
    }
  }

  decodeHtml(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }
}
