/**
 * DOM manipulation utilities
 */

/**
 * Find YouTube secondary column for widget injection
 * @returns {HTMLElement|null} Target element
 */
export function findSecondaryColumn() {
    const selectors = [
        '#secondary',
        '#secondary-inner',
        '#related',
        'ytd-watch-next-secondary-results-renderer'
    ]

    for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el && el.offsetParent !== null) {
            return el
        }
    }
    return null
}

/**
 * Seek video to specific time
 * @param {number} seconds - Time in seconds
 */
export function seekVideo(seconds) {
    const video = document.querySelector('video')
    if (video) {
        video.currentTime = seconds
        video.play()
    }
}

/**
 * Get current video element
 * @returns {HTMLVideoElement|null}
 */
export function getVideoElement() {
    return document.querySelector('video')
}

/**
 * Decode HTML entities
 * @param {string} html - HTML string
 * @returns {string} Decoded string
 */
export function decodeHTML(html) {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
}
