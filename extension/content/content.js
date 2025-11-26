/**
 * YouTube AI Master - Content Script
 * Handles DOM interaction: video seeking, data extraction, and UI injection.
 */

console.log('YouTube AI Master: Content script loaded.')

// Listen for messages from the extension (Side Panel / Background)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SEEK_TO') {
    seekToTimestamp(request.timestamp)
    sendResponse({ status: 'success' })
  } else if (request.action === 'GET_VIDEO_DATA') {
    // Placeholder for extracting data if needed directly from DOM
    sendResponse({ title: document.title })
  } else if (request.action === 'GET_COMMENTS') {
    const comments = extractComments()
    sendResponse({ comments })
  }
})

/**
 * Extracts top comments from the DOM.
 * @returns {Array<string>}
 */
function extractComments() {
  const commentElements = document.querySelectorAll('#content-text')
  const comments = []
  // Get top 10 visible comments
  for (let i = 0; i < Math.min(commentElements.length, 10); i++) {
    comments.push(commentElements[i].innerText)
  }

  if (comments.length === 0) {
    // Try to scroll down a bit to trigger loading?
    // Or just warn that comments might not be loaded.
    console.warn('YouTube AI Master: No comments found in DOM. User might need to scroll.')
  }
  return comments
}

/**
 * Seeks the YouTube video player to the specified timestamp.
 * @param {number} seconds - Timestamp in seconds.
 */
function seekToTimestamp(seconds) {
  const video = document.querySelector('video')
  if (video) {
    video.currentTime = seconds
    video.play() // Optional: auto-play after seek
    console.log(`YouTube AI Master: Seeked to ${seconds}s`)
  } else {
    console.error('YouTube AI Master: Video element not found.')
  }
}

// Example: Inject a button (placeholder for future UI)
function injectTestButton() {
  // Wait for player to be ready
  const checkPlayer = setInterval(() => {
    const player = document.querySelector('#movie_player')
    if (player) {
      clearInterval(checkPlayer)
      console.log('YouTube AI Master: Player found, ready for injection.')
      // Logic to inject UI elements can go here
    }
  }, 1000)
}

injectTestButton()
