/**
 * Loading, error, and placeholder components
 */

/**
 * Show loading spinner with message
 */
export function showLoading(container, message) {
    if (!container) return
    container.innerHTML = `
    <div class="yt-ai-loading">
      <div class="yt-ai-spinner"></div>
      <div class="yt-ai-loading-text">${message}</div>
    </div>
  `
}

/**
 * Show error message
 */
export function showError(container, message) {
    if (!container) return
    container.innerHTML = `
    <div class="yt-ai-error">
      <div class="yt-ai-error-icon">❌</div>
      <div class="yt-ai-error-msg">${message}</div>
      <button class="yt-ai-btn" onclick="document.getElementById('yt-ai-refresh-btn')?.click()">
        Try Again
      </button>
    </div>
  `
}

/**
 * Show placeholder message
 */
export function showPlaceholder(container, message) {
    if (!container) return
    container.innerHTML = `
    <div class="yt-ai-placeholder">${message}</div>
  `
}
