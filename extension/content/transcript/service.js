import { decodeHTML } from '../utils/dom.js'

// Singleton instance
let transcriptServiceInstance = null

/**
 * Logger utility for consistent logging
 */
class Logger {
    constructor(prefix) {
        this.prefix = prefix
    }

    info(message, ...args) {
        console.log(`[${this.prefix}] ℹ️ ${message}`, ...args)
    }

    success(message, ...args) {
        console.log(`[${this.prefix}] ✅ ${message}`, ...args)
    }

    warn(message, ...args) {
        console.warn(`[${this.prefix}] ⚠️ ${message}`, ...args)
    }

    error(message, ...args) {
        console.error(`[${this.prefix}] ❌ ${message}`, ...args)
    }

    debug(message, ...args) {
        console.debug(`[${this.prefix}] 🔍 ${message}`, ...args)
    }
}

const logger = new Logger('TranscriptService')

/**
 * Comprehensive Transcript Service
 * Implements all 4 extraction methods from TRANSCRIPT_EXTRACTION_METHODS.md
 */
export class TranscriptService {
    constructor() {
        this.xhrInterceptor = null
        this.interceptedTranscripts = new Map()
    }

    /**
     * Main entry point - tries all methods in priority order
     * Priority Order:
     * 1. XHR Interceptor (Fastest if available)
     * 2. Invidious API (Primary - CORS-free, reliable)
     * 3. YouTube Direct API (Direct timedtext endpoint)
     * 4. Background Proxy (Service worker fallback)
     * 5. DOM Parser (ytInitialPlayerResponse)
     */
    async getTranscript(v, l = 'en') {
        logger.info(`Fetching transcript for video: ${v}, language: ${l}`)

        // Priority order as documented
        const methods = [
            { name: 'XHR Interceptor', fn: () => this._method0_XHRInterceptor(v, l) },
            { name: 'Invidious API', fn: () => this._method1_InvidiousAPI(v, l) },
            { name: 'YouTube Direct API', fn: () => this._method2_YouTubeDirectAPI(v, l) },
            { name: 'Background Proxy', fn: () => this._method3_BackgroundProxy(v, l) },
            { name: 'DOM Parser (ytInitialPlayerResponse)', fn: () => this._method4_DOMParser(v, l) }
        ]

        let lastError = null

        for (let i = 0; i < methods.length; i++) {
            const method = methods[i]
            try {
                logger.info(`Attempting method ${i + 1}/${methods.length}: ${method.name}`)
                const startTime = performance.now()

                const result = await method.fn()

                if (result?.length > 0) {
                    const duration = (performance.now() - startTime).toFixed(2)
                    logger.success(`${method.name} succeeded in ${duration}ms with ${result.length} segments`)
                    return result
                } else {
                    logger.warn(`${method.name} returned empty result`)
                }
            } catch (e) {
                lastError = e
                logger.error(`${method.name} failed:`, e.message)
            }
        }

        // Provide more specific error messages
        if (lastError?.message.includes('No transcript data') || lastError?.message.includes('captions')) {
            throw new Error('This video does not have captions available')
        }
        throw new Error('Unable to fetch transcript. The video may not have captions enabled.')
    }

    /**
     * Get video metadata using multiple methods
     */
    async getMetadata(v) {
        logger.info(`Fetching metadata for video: ${v}`)

        // Try Invidious API first
        try {
            logger.debug('Attempting Invidious API for metadata')
            const r = await chrome.runtime.sendMessage({ action: 'FETCH_INVIDIOUS_METADATA', videoId: v })
            if (r.success) {
                logger.success('Metadata fetched from Invidious API')
                return r.data
            }
        } catch (e) {
            logger.warn('Invidious metadata fetch failed:', e.message)
        }

        // Fallback to ytInitialPlayerResponse
        if (window.ytInitialPlayerResponse) {
            logger.debug('Using ytInitialPlayerResponse for metadata')
            const d = window.ytInitialPlayerResponse.videoDetails
            return {
                title: d.title,
                duration: parseInt(d.lengthSeconds, 10),
                author: d.author,
                viewCount: d.viewCount,
                videoId: v
            }
        }

        // Fallback to background message
        try {
            logger.debug('Attempting background proxy for metadata')
            const r = await chrome.runtime.sendMessage({ action: 'GET_METADATA', videoId: v })
            if (r.success) return r.data
        } catch (e) {
            logger.error('Background metadata fetch failed:', e.message)
        }

        throw new Error('Failed to get metadata')
    }

    /**
     * Get available caption tracks
     */
    getAvailableCaptions() {
        const playerResponse = this._getPlayerResponse()
        if (!playerResponse?.captions) {
            return []
        }

        const renderer = playerResponse.captions.playerCaptionsTracklistRenderer
        return renderer?.captionTracks || []
    }

    // ============================================================================
    // METHOD 0: XHR Interceptor (Fastest if available)
    // ============================================================================
    async _method0_XHRInterceptor(v, l) {
        logger.debug(`[Method 0] XHR Interceptor for video ${v}, lang ${l}`)

        const intercepted = this.getInterceptedTranscript(l)
        if (!intercepted) {
            throw new Error('No intercepted transcript available')
        }

        // Parse the intercepted data
        try {
            const data = JSON.parse(intercepted)
            if (data.events) {
                const segments = data.events
                    .filter(e => e.segs)
                    .map(e => ({
                        start: e.tStartMs / 1000,
                        duration: (e.dDurationMs || 0) / 1000,
                        text: e.segs.map(s => s.utf8).join('')
                    }))

                if (segments.length > 0) {
                    logger.debug(`[Method 0] Interceptor returned ${segments.length} segments`)
                    return segments
                }
            }
        } catch (e) {
            // Try XML parsing
            const segments = this._parseXML(intercepted)
            if (segments.length > 0) {
                logger.debug(`[Method 0] Interceptor returned ${segments.length} segments (XML)`)
                return segments
            }
        }

        throw new Error('Failed to parse intercepted transcript')
    }

    // ============================================================================
    // METHOD 1: Invidious API (Primary - CORS-free, reliable)
    // ============================================================================
    async _method1_InvidiousAPI(v, l) {
        logger.debug(`[Method 1] Invidious API for video ${v}, lang ${l}`)
        try {
            const r = await chrome.runtime.sendMessage({
                action: 'FETCH_INVIDIOUS_TRANSCRIPT',
                videoId: v,
                lang: l
            })

            if (r.success && r.data) {
                logger.debug(`[Method 1] Invidious returned ${r.data.length} segments`)
                return r.data
            }

            throw new Error(r.error || 'Invidious API returned no data')
        } catch (e) {
            logger.error('[Method 1] Invidious API error:', e.message)
            throw new Error(`Invidious API failed: ${e.message}`)
        }
    }

    // ============================================================================
    // METHOD 2: YouTube Direct API (timedtext endpoint)
    // ============================================================================
    async _method2_YouTubeDirectAPI(v, l) {
        logger.debug(`[Method 2] YouTube Direct API for video ${v}, lang ${l}`)

        // Try JSON3 format first (most detailed)
        const formats = ['json3', 'srv3', 'srv2', 'srv1']

        for (const fmt of formats) {
            try {
                const url = `https://www.youtube.com/api/timedtext?v=${v}&lang=${l}&fmt=${fmt}`
                logger.debug(`[Method 2] Trying format: ${fmt}, URL: ${url}`)

                const response = await fetch(url)
                if (!response.ok) {
                    logger.warn(`[Method 2] Format ${fmt} failed: HTTP ${response.status}`)
                    continue
                }

                const contentType = response.headers.get('content-type')
                logger.debug(`[Method 2] Response content-type: ${contentType}`)

                if (fmt === 'json3') {
                    const data = await response.json()
                    if (data.events) {
                        const segments = data.events
                            .filter(e => e.segs)
                            .map(e => ({
                                start: e.tStartMs / 1000,
                                duration: (e.dDurationMs || 0) / 1000,
                                text: e.segs.map(s => s.utf8).join('')
                            }))

                        if (segments.length > 0) {
                            logger.debug(`[Method 2] JSON3 format returned ${segments.length} segments`)
                            return segments
                        }
                    }
                } else {
                    // srv formats return XML
                    const xmlText = await response.text()
                    const segments = this._parseXML(xmlText)
                    if (segments.length > 0) {
                        logger.debug(`[Method 2] ${fmt} format returned ${segments.length} segments`)
                        return segments
                    }
                }
            } catch (e) {
                logger.warn(`[Method 2] Format ${fmt} error:`, e.message)
                continue
            }
        }

        throw new Error('YouTube Direct API failed for all formats')
    }

    // ============================================================================
    // METHOD 3: Background Proxy (through service worker)
    // ============================================================================
    async _method3_BackgroundProxy(v, l) {
        logger.debug(`[Method 3] Background Proxy for video ${v}, lang ${l}`)

        const r = await chrome.runtime.sendMessage({
            action: 'FETCH_TRANSCRIPT',
            videoId: v,
            lang: l
        })

        if (!r.success) {
            throw new Error(r.error || 'Background proxy failed')
        }

        logger.debug(`[Method 3] Background proxy returned data`)
        return r.data.segments || r.data
    }

    // ============================================================================
    // METHOD 4: DOM Parser (ytInitialPlayerResponse)
    // ============================================================================
    async _method4_DOMParser(v, l) {
        logger.debug(`[Method 4] DOM Parser for video ${v}, lang ${l}`)

        const playerResponse = this._getPlayerResponse()
        if (!playerResponse) {
            throw new Error('ytInitialPlayerResponse not found')
        }

        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (!captionTracks || captionTracks.length === 0) {
            throw new Error('No caption tracks found in player response')
        }

        logger.debug(`[Method 4] Found ${captionTracks.length} caption tracks`)

        // Find track matching language
        let track = captionTracks.find(t => t.languageCode === l)
        if (!track) {
            logger.warn(`[Method 4] Language '${l}' not found, using first available: ${captionTracks[0].languageCode}`)
            track = captionTracks[0]
        }

        logger.debug(`[Method 4] Selected track:`, {
            name: track.name?.simpleText,
            languageCode: track.languageCode,
            kind: track.kind
        })

        // Fetch transcript from baseUrl
        const response = await fetch(track.baseUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch transcript: HTTP ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        logger.debug(`[Method 4] Response content-type: ${contentType}`)

        // Parse based on content type
        if (contentType?.includes('json')) {
            const data = await response.json()
            if (data.events) {
                const segments = data.events
                    .filter(e => e.segs)
                    .map(e => ({
                        start: e.tStartMs / 1000,
                        duration: (e.dDurationMs || 0) / 1000,
                        text: e.segs.map(s => s.utf8).join('')
                    }))
                logger.debug(`[Method 4] Parsed ${segments.length} segments from JSON`)
                return segments
            }
        } else {
            // Assume XML format
            const xmlText = await response.text()
            const segments = this._parseXML(xmlText)
            logger.debug(`[Method 4] Parsed ${segments.length} segments from XML`)
            return segments
        }

        throw new Error('DOM parser failed to extract segments')
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Get ytInitialPlayerResponse from page
     */
    _getPlayerResponse() {
        // Try window object first
        if (window.ytInitialPlayerResponse) {
            return window.ytInitialPlayerResponse
        }

        // Try parsing from script tags
        const scripts = document.querySelectorAll('script')
        for (const script of scripts) {
            const match = script.textContent?.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)
            if (match) {
                try {
                    return JSON.parse(match[1])
                } catch (e) {
                    logger.error('Failed to parse ytInitialPlayerResponse:', e)
                }
            }
        }

        return null
    }

    /**
     * Parse XML format captions
     */
    _parseXML(xmlText) {
        const segments = []
        const regex = /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g
        let match

        while ((match = regex.exec(xmlText)) !== null) {
            const start = parseFloat(match[1])
            const duration = match[2] ? parseFloat(match[2]) : 0
            const text = decodeHTML(match[3])

            if (text.trim()) {
                segments.push({ start, duration, text })
            }
        }

        return segments
    }

    /**
     * Parse VTT format captions (used by Invidious)
     */
    _parseVTT(vttText) {
        const segments = []
        const lines = vttText.split('\n')
        let i = 0

        while (i < lines.length) {
            const line = lines[i].trim()

            // Look for timestamp line
            if (line.includes('-->')) {
                const [startStr, endStr] = line.split('-->').map(t => t.trim())
                const start = this._parseVTTTime(startStr)
                const end = this._parseVTTTime(endStr)

                i++
                let text = ''

                // Collect text lines
                while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
                    text += lines[i].trim() + ' '
                    i++
                }

                // Clean up text
                text = text.trim().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')

                if (text) {
                    segments.push({
                        start,
                        duration: end - start,
                        text
                    })
                }
            }
            i++
        }

        return segments
    }

    /**
     * Parse VTT timestamp to seconds
     */
    _parseVTTTime(timestamp) {
        const parts = timestamp.split(':')

        if (parts.length === 3) {
            // HH:MM:SS.mmm
            const [h, m, s] = parts
            return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s)
        } else if (parts.length === 2) {
            // MM:SS.mmm
            const [m, s] = parts
            return parseFloat(m) * 60 + parseFloat(s)
        } else {
            // SS.mmm
            return parseFloat(parts[0])
        }
    }

    /**
     * Initialize XHR interception (Method 3 alternative)
     * This can capture transcripts as YouTube loads them
     */
    initXHRInterception() {
        if (this.xhrInterceptor) {
            return // Already initialized
        }

        logger.info('Initializing XHR interception for transcript capture')

        const originalOpen = XMLHttpRequest.prototype.open
        const originalSend = XMLHttpRequest.prototype.send
        const self = this

        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            this._url = url
            return originalOpen.apply(this, [method, url, ...args])
        }

        XMLHttpRequest.prototype.send = function (body) {
            this.addEventListener('readystatechange', function () {
                if (this.readyState === 4 && this._url?.includes('/timedtext')) {
                    try {
                        const url = new URL(this._url)
                        const lang = url.searchParams.get('lang') || url.searchParams.get('tlang')

                        if (lang && this.responseText) {
                            logger.debug(`[XHR Intercept] Captured transcript for language: ${lang}`)
                            self.interceptedTranscripts.set(lang, this.responseText)
                        }
                    } catch (e) {
                        logger.error('[XHR Intercept] Error processing intercepted request:', e)
                    }
                }
            })
            return originalSend.apply(this, [body])
        }

        this.xhrInterceptor = true
    }

    /**
     * Get intercepted transcript if available
     */
    getInterceptedTranscript(lang = 'en') {
        return this.interceptedTranscripts.get(lang)
    }
}


/**
 * Get transcript for a video (convenience function)
 */
export async function getTranscript(videoId, lang = 'en') {
    if (!transcriptServiceInstance) {
        transcriptServiceInstance = new TranscriptService()
    }
    return transcriptServiceInstance.getTranscript(videoId, lang)
}

/**
 * Get video metadata (convenience function)
 */
export async function getMetadata(videoId) {
    if (!transcriptServiceInstance) {
        transcriptServiceInstance = new TranscriptService()
    }
    return transcriptServiceInstance.getMetadata(videoId)
}

/**
 * Get available caption tracks
 */
export function getAvailableCaptions() {
    if (!transcriptServiceInstance) {
        transcriptServiceInstance = new TranscriptService()
    }
    return transcriptServiceInstance.getAvailableCaptions()
}

/**
 * Check if captions are available
 */
export function hasCaptions() {
    const tracks = getAvailableCaptions()
    return tracks.length > 0
}
