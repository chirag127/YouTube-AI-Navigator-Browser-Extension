// Input validation & sanitization for MV3 security
const ALLOWED_ACTIONS = new Set([
    'TEST', 'GET_SETTINGS', 'FETCH_TRANSCRIPT', 'ANALYZE_VIDEO', 'ANALYZE_COMMENTS',
    'GENERATE_SUMMARY', 'CLASSIFY_SEGMENTS', 'CHAT_WITH_VIDEO', 'SAVE_TO_HISTORY',
    'GET_METADATA', 'FETCH_INVIDIOUS_TRANSCRIPT', 'FETCH_INVIDIOUS_METADATA',
    'FETCH_PIPED_METADATA', 'FETCH_PIPED_TRANSCRIPT',
    'GET_CACHED_DATA', 'SAVE_CHAT_MESSAGE', 'SAVE_COMMENTS',
    'GET_VIDEO_DATA',
    'INNERTUBE_GET_TRANSCRIPT', 'INNERTUBE_GET_VIDEO_INFO', 'INNERTUBE_GET_COMMENTS',
    'TRANSCRIBE_AUDIO', 'GET_LYRICS', 'OPEN_OPTIONS'
])

const MAX_TRANSCRIPT_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_STRING_LENGTH = 10000
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export const validateMessage = (req) => {
    const action = req.action || req.type
    if (!action || !ALLOWED_ACTIONS.has(action)) return { valid: false, error: 'Invalid action' }
    return { valid: true }
}

export const sanitizeVideoId = (id) => {
    if (!id || typeof id !== 'string') return null
    const clean = id.trim().slice(0, 11)
    return VIDEO_ID_REGEX.test(clean) ? clean : null
}

export const sanitizeString = (str, maxLen = MAX_STRING_LENGTH) => {
    if (!str || typeof str !== 'string') return ''
    return str.slice(0, maxLen).replace(/[<>]/g, '')
}

export const validateTranscript = (transcript) => {
    if (!Array.isArray(transcript)) return false
    if (JSON.stringify(transcript).length > MAX_TRANSCRIPT_SIZE) return false
    return transcript.every(seg =>
        typeof seg === 'object' &&
        typeof seg.start === 'number' &&
        typeof seg.text === 'string'
    )
}

export const sanitizeRequest = (req) => {
    const sanitized = { ...req }
    if (req.videoId) sanitized.videoId = sanitizeVideoId(req.videoId)
    if (req.question) sanitized.question = sanitizeString(req.question, 5000)
    if (req.title) sanitized.title = sanitizeString(req.title, 500)
    if (req.summary) sanitized.summary = sanitizeString(req.summary, 50000)
    return sanitized
}
