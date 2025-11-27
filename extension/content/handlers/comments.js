/**
 * Comments handler
 */

/**
 * Fetch comments from YouTube DOM
 * @returns {Promise<Array>} Array of comment objects
 */
export async function fetchCommentsFromDOM() {
    return new Promise(resolve => {
        setTimeout(() => {
            const comments = []
            const elements = document.querySelectorAll('ytd-comment-thread-renderer')

            for (const el of elements) {
                if (comments.length >= 20) break

                try {
                    const author = el.querySelector('#author-text')?.textContent?.trim()
                    const text = el.querySelector('#content-text')?.textContent?.trim()
                    const likes = el.querySelector('#vote-count-middle')?.textContent?.trim() || '0'

                    if (author && text) {
                        comments.push({ author, text, likes })
                    }
                } catch (e) {
                    console.warn('Failed to parse comment:', e)
                }
            }

            resolve(comments)
        }, 1000)
    })
}
