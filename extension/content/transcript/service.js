/**
 * Transcript extraction service with 4 fallback methods
 */

import { decodeHTML } from '../utils/dom.js'

export class TranscriptService {
    constructor() {
        this.invidiousInstances = [
            'https://invidious.fdn.fr',
            'https://inv.nadeko.net',
            'https://invidious.privacyredirect.com',
            'https://invidious.protokolla.fi',
            'https://yt.artemislena.eu'
        ]
    }

    /**
     * Get transcript with fallback methods
     * @param {string} videoId - YouTube video ID
     * @param {string} lang - Language code
     * @returns {Promise<Array>} Transcript segments
     */
    async getTranscript(videoId, lang = 'en') {
        const methods = [
            () => this._method1_YouTubeAPI(videoId, lang),
            () => this._method2_InvidiousAPI(videoId, lang),
            () => this._method3_BackgroundProxy(videoId, lang),
            () => this._method4_DOMParse()
        ]

        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`Transcript method ${i + 1}...`)
                const result = await methods[i]()
                if (result?.length > 0) {
                    console.log(`✓ Method ${i + 1} succeeded`)
                    return result
                }
            } catch (e) {
                console.warn(`Method ${i + 1} failed:`, e.message)
            }
        }

        throw new Error('All transcript methods failed')
    }

    /**
     * Get video metadata
     */
    async getMetadata(videoId) {
        try {
            // Try Invidious first (faster)
            for (const instance of this.invidiousInstances) {
                try {
                    const url = `${instance}/api/v1/videos/${videoId}`
                    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
                    if (!response.ok) continue

                    const data = await response.json()
                    return {
                        title: data.title,
                        duration: data.lengthSeconds,
                        author: data.author,
                        viewCount: data.viewCount
                    }
                } catch (e) {
                    continue
                }
            }
        } catch (e) {
            console.warn('Invidious metadata failed, trying DOM')
        }

        // Fallback to DOM
        if (window.ytInitialPlayerResponse) {
            const details = window.ytInitialPlayerResponse.videoDetails
            return {
                title: details.title,
                duration: parseInt(details.lengthSeconds, 10),
                author: details.author,
                viewCount: details.viewCount
            }
        }

        throw new Error('Failed to get metadata')
    }

    async _method1_YouTubeAPI(videoId, lang) {
        const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`
        const response = await fetch(url)
        if (!response.ok) throw new Error('YouTube API failed')

        const data = await response.json()
        if (!data.events) throw new Error('No transcript data')

        return data.events
            .filter(e => e.segs)
            .map(e => ({
                start: e.tStartMs / 1000,
                duration: (e.dDurationMs || 0) / 1000,
                text: e.segs.map(s => s.utf8).join('')
            }))
    }

    async _method2_InvidiousAPI(videoId, lang) {
        for (const instance of this.invidiousInstances) {
            try {
                const url = `${instance}/api/v1/captions/${videoId}?label=${lang}`
                const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
                if (!response.ok) continue

                const data = await response.json()
                if (!data.captions?.length) continue

                return data.captions.map(c => ({
                    start: c.start,
                    duration: c.duration,
                    text: c.text
                }))
            } catch (e) {
                continue
            }
        }
        throw new Error('All Invidious instances failed')
    }

    async _method3_BackgroundProxy(videoId, lang) {
        const response = await chrome.runtime.sendMessage({
            action: 'FETCH_TRANSCRIPT',
            videoId,
            lang
        })
        if (!response.success) throw new Error(response.error)
        return response.data.segments
    }

    async _method4_DOMParse() {
        if (window.ytInitialPlayerResponse) {
            const tracks = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks
            if (tracks?.length > 0) {
                const track = tracks[0]
                const response = await fetch(track.baseUrl)
                const xml = await response.text()
                return this._parseXML(xml)
            }
        }
        throw new Error('DOM parse failed')
    }

    _parseXML(xml) {
        const segments = []
        const regex = /<text start="([\d.]+)" dur="([\d.]+)">([^<]+)<\/text>/g
        let match

        while ((match = regex.exec(xml)) !== null) {
            segments.push({
                start: parseFloat(match[1]),
                duration: parseFloat(match[2]),
                text: decodeHTML(match[3])
            })
        }

        return segments
    }
}
