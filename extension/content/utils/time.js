/**
 * Time formatting utilities
 */

/**
 * Format seconds to MM:SS or HH:MM:SS
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Parse time string (MM:SS or HH:MM:SS) to seconds
 * @param {string} timeStr - Time string to parse
 * @returns {number} Total seconds
 */
export function parseTime(timeStr) {
    const parts = timeStr.split(':').map(Number)
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    return parts[0] * 60 + parts[1]
}
