/**
 * Comprehensive Transcript Extractor
 * Unified interface for all transcript extraction methods
 *
 * Implements all methods from TRANSCRIPT_EXTRACTION_METHODS.md:
 * 1. Invidious API (Primary)
 * 2. YouTube Direct API (timedtext)
 * 3. Background Proxy (Service Worker)
 * 4. DOM Parser (ytInitialPlayerResponse)
 * 5. XHR Interception (Bonus method)
 */

import transcriptInterceptor from './xhr-interceptor.js'

class TranscriptExtractor {
    constructor() {
        this.logger = this._createLogger('TranscriptExtractor')
        this.cache = new Map()
        this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
    }

    _createLogger(prefix) {
        return {
            info: (msg, ...args) => console.log(`[${prefix}] ℹ️ ${msg}`, ...args),
            success: (msg, ...args) => console.log(`[${prefix}] ✅ ${msg}`, ...args),
            warn: (msg, ...args) => console.warn(`[${prefix}] ⚠️ ${msg}`, ...args),
            error: (msg, ...args) => console.error(`[${prefix}] ❌ ${msg}`, ...args),
            debug: (msg, ...args) => console.debug(`[${prefix}] 🔍 ${msg}`, ...args)
        }
    }

    /**
     * Main extraction method - tries all methods in priority order
     */
    async extract(videoId, options = {}) {
        const { lang = 'en',
            preferredMethod = null,
            useCache = true,
            timeout = 30000
        } = options

        this.logger.info(`Extracting transcript for ${videoId}, lang: ${lang}`)

        // Check cache first
        if (useCache) {
            const cached = this._getFromCache(videoId, lang)
            if (cached) {
                this.logger.success('Retrieved from cache')
                return cached
            }
        }

        // If preferred method specified, try it first
        if (preferredMethod) {
            try {
                const result = await this._extractWithMethod(preferredMethod, videoId, lang, timeout)
                if (result?.length > 0) {
                    this._saveToCache(videoId, lang, result)
                    return result
                }
                this.logger.error(`Preferred method '${preferredMethod}' returned empty result`)
            } catch (e) {
                this.logger.error(`Preferred method '${preferredMethod}' failed:`, e.message)
            }
        }

        // Try all methods in priority order
        const methods = [
            'interceptor',  // Check if already intercepted
            'invidious',    // Primary method
            'youtube',      // Direct API
            'background',   // Service worker proxy
            'dom'           // DOM parser
        ]

        let lastError = null

        for (const method of methods) {
            try {
                this.logger.debug(`Trying method: ${method}`)
                const result = await this._extractWithMethod(method, videoId, lang, timeout)

                if (result?.length > 0) {
                    this.logger.success(`Method '${method}' succeeded with ${result.length} segments`)
                    this._saveToCache(videoId, lang, result)
                    return result
                }
                this.logger.warn(`Method '${method}' returned empty result`)
            } catch (e) {
                lastError = e
                this.logger.error(`Method '${method}' failed:`, e.message)
            }
        }

        throw new Error(lastError?.message || 'All extraction methods failed')
    }

    /**
     * Extract using specific method
     * Priority Order:
     * 1. XHR Interceptor (Fastest if available)
     * 2. Invidious API (Primary - CORS-free, reliable)
     * 3. YouTube Direct API (Direct timedtext endpoint)
     * 4. Background Proxy (Service worker fallback)
     * 5. DOM Parser (ytInitialPlayerResponse)
     */
    async _extractWithMethod(method, videoId, lang, timeout) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), timeout)
        })

        const extractPromise = (async () => {
            switch (method) {
                case 'interceptor':
                    return this._extractFromInterceptor(videoId, lang)
                case 'invidious':
                    return this._extractFromInvidious(videoId, lang)
                case 'youtube':
                    return this._extractFromYouTube(videoId, lang)
                case 'background':
                    return this._extractFromBackground(videoId, lang)
                case 'dom':
                    return this._extractFromDOM(videoId, lang)
                default:
                    throw new Error(`Unknown method: ${method}`)
            }
        })()

        return Promise.race([extractPromise, timeoutPromise])
    }

    /**
     * Method 0: Check XHR Interceptor (fastest if available)
     */
    async _extractFromInterceptor(videoId, lang) {
        const transcript = transcriptInterceptor.getTranscript(videoId, lang)
        if (!transcript || transcript.length === 0) {
            const error = new Error('No intercepted transcript available')
            this.logger.error('XHR Interceptor method failed:', error.message)
            throw error
        }
        return transcript
    }

    /**
     * Method 1: Invidious API
     */
    async _extractFromInvidious(videoId, lang) {
        const response = await chrome.runtime.sendMessage({
            action: 'FETCH_INVIDIOUS_TRANSCRIPT',
            videoId,
            lang
        })

        if (!response.success || !response.data) {
            const error = new Error(response.error || 'Invidious API failed')
            this.logger.error('Invidious API method failed:', error.message)
            throw error
        }

        return response.data
    }

    /**
     * Method 2: YouTube Direct API
     */
    async _extractFromYouTube(videoId, lang) {
        const formats = ['json3', 'srv3', 'srv2', 'srv1']

        for (const fmt of formats) {
            try {
                const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}`
                const response = await fetch(url)

                if (!response.ok) continue

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

                        if (segments.length > 0) return segments
                    }
                } else {
                    const xmlText = await response.text()
                    const segments = this._parseXML(xmlText)
                    if (segments.length > 0) return segments
                }
            } catch (e) {
                continue
            }
        }

        throw new Error('YouTube Direct API failed')
    }

    /**
     * Method 3: Background Proxy
     */
    async _extractFromBackground(videoId, lang) {
        const response = await chrome.runtime.sendMessage({
            action: 'FETCH_TRANSCRIPT',
            videoId,
            lang
        })

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Background proxy failed')
        }

        return response.data.segments || response.data
    }

    /**
     * Method 4: DOM Parser
     */
    async _extractFromDOM(videoId, lang) {
        const playerResponse = this._getPlayerResponse()
        if (!playerResponse) {
            throw new Error('ytInitialPlayerResponse not found')
        }

        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (!captionTracks || captionTracks.length === 0) {
            throw new Error('No caption tracks found')
        }

        // Find matching language track
        let track = captionTracks.find(t => t.languageCode === lang)
        if (!track) {
            track = captionTracks[0] // Use first available
        }

        // Fetch transcript
        const response = await fetch(track.baseUrl)
        if (!response.ok) {
            throw new Error(`Failed to fetch: HTTP ${response.status}`)
        }

        const contentType = response.headers.get('content-type')

        if (contentType?.includes('json')) {
            const data = await response.json()
            if (data.events) {
                return data.events
                    .filter(e => e.segs)
                    .map(e => ({
                        start: e.tStartMs / 1000,
                        duration: (e.dDurationMs || 0) / 1000,
                        text: e.segs.map(s => s.utf8).join('')
                    }))
            }
        } else {
            const xmlText = await response.text()
            return this._parseXML(xmlText)
        }

        throw new Error('DOM parser failed')
    }

    /**
     * Get available caption tracks
     */
    getAvailableTracks() {
        const playerResponse = this._getPlayerResponse()
        if (!playerResponse?.captions) {
            return []
        }

        const renderer = playerResponse.captions.playerCaptionsTracklistRenderer
        return renderer?.captionTracks || []
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        const tracks = this.getAvailableTracks()
        return tracks.map(t => ({
            code: t.languageCode,
            name: t.name?.simpleText || t.languageCode,
            kind: t.kind // 'asr' or 'manual'
        }))
    }

    /**
     * Check if captions are available
     */
    hasCaptions() {
        return this.getAvailableTracks().length > 0
    }

    /**
     * Format transcript with timestamps
     */
    formatWithTimestamps(segments) {
        return segments.map(seg => {
            const timestamp = this._formatTime(seg.start)
            return `[${timestamp}] ${seg.text}`
        }).join('\n')
    }

    /**
     * Format transcript as plain text
     */
    formatPlainText(segments) {
        return segments.map(seg => seg.text).join(' ')
    }

    /**
     * Format time in HH:MM:SS or MM:SS
     */
    _formatTime(seconds) {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = Math.floor(seconds % 60)

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        }
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    /**
     * Parse XML format
     */
    _parseXML(xmlText) {
        const segments = []
        const regex = /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g
        let match

        while ((match = regex.exec(xmlText)) !== null) {
            const start = parseFloat(match[1])
            const duration = match[2] ? parseFloat(match[2]) : 0
            const text = this._decodeHTML(match[3])

            if (text.trim()) {
                segments.push({ start, duration, text })
            }
        }

        return segments
    }

    /**
     * Decode HTML entities
     */
    _decodeHTML(text) {
        const textarea = document.createElement('textarea')
        textarea.innerHTML = text
        return textarea.value
    }

    /**
     * Get player response
     */
    _getPlayerResponse() {
        if (window.ytInitialPlayerResponse) {
            return window.ytInitialPlayerResponse
        }

        const scripts = document.querySelectorAll('script')
        for (const script of scripts) {
            const match = script.textContent?.match(/ytInitialPlayerResponse\s*=\s*({.+?});/)
            if (match) {
                try {
                    return JSON.parse(match[1])
                } catch (e) {
                    this.logger.error('Failed to parse ytInitialPlayerResponse:', e)
                }
            }
        }

        return null
    }

    /**
     * Cache management
     */
    _getFromCache(videoId, lang) {
        const key = `${videoId}_${lang}`
        const cached = this.cache.get(key)

        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data
        }

        return null
    }

    _saveToCache(videoId, lang, data) {
        const key = `${videoId}_${lang}`
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        })
    }

    clearCache() {
        this.cache.clear()
        this.logger.info('Cache cleared')
    }
}

// Create singleton instance
const transcriptExtractor = new TranscriptExtractor()

// Export
export default transcriptExtractor
export { TranscriptExtractor }
