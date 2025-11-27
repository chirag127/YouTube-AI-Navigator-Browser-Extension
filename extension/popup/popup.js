/**
 * YouTube AI Master - Popup Script
 * Quick access to extension features
 */

// DOM Elements
const apiStatus = document.getElementById('api-status')
const pageStatus = document.getElementById('page-status')
const analyzeBtn = document.getElementById('analyze-btn')
const historyBtn = document.getElementById('history-btn')
const optionsBtn = document.getElementById('options-btn')
const messageEl = document.getElementById('message')

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
  messageEl.textContent = text
  messageEl.className = `show ${type}`
  setTimeout(() => {
    messageEl.classList.remove('show')
  }, 3000)
}

/**
 * Check API key status
 */
async function checkApiStatus() {
  try {
    const syncResult = await chrome.storage.sync.get('apiKey')
    const localResult = await chrome.storage.local.get('geminiApiKey')

    const hasKey = syncResult.apiKey || localResult.geminiApiKey

    if (hasKey) {
      apiStatus.innerHTML = '<span>✅ Configured</span>'
      apiStatus.className = 'value success'
      return true
    }
    apiStatus.innerHTML = '<span>⚠️ Not configured</span>'
    apiStatus.className = 'value warning'
    return false
  } catch (error) {
    apiStatus.innerHTML = '<span>❌ Error</span>'
    apiStatus.className = 'value error'
    return false
  }
}

/**
 * Check current page status
 */
async function checkPageStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab || !tab.url) {
      pageStatus.innerHTML = '<span>❌ No active tab</span>'
      pageStatus.className = 'value error'
      return null
    }

    if (tab.url.includes('youtube.com/watch')) {
      const url = new URL(tab.url)
      const videoId = url.searchParams.get('v')

      if (videoId) {
        pageStatus.innerHTML = '<span>✅ YouTube Video</span>'
        pageStatus.className = 'value success'
        return { tab, videoId }
      }
    }

    pageStatus.innerHTML = '<span>⚠️ Not a YouTube video</span>'
    pageStatus.className = 'value warning'
    return null
  } catch (error) {
    pageStatus.innerHTML = '<span>❌ Error</span>'
    pageStatus.className = 'value error'
    return null
  }
}

/**
 * Initialize popup
 */
async function init() {
  const hasApiKey = await checkApiStatus()
  const pageInfo = await checkPageStatus()

  // Enable analyze button only if on YouTube video with API key
  if (hasApiKey && pageInfo) {
    analyzeBtn.disabled = false
  }
}

// Event Listeners
analyzeBtn.addEventListener('click', async () => {
  try {
    analyzeBtn.disabled = true
    analyzeBtn.textContent = '⏳ Analyzing...'

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (!tab) {
      showMessage('No active tab found', 'error')
      return
    }

    // Send message to content script to start analysis
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'START_ANALYSIS' })

    if (response?.success) {
      showMessage('Analysis started!', 'success')
      // Close popup after short delay
      setTimeout(() => window.close(), 1000)
    } else {
      showMessage(response?.error || 'Failed to start analysis', 'error')
    }
  } catch (error) {
    console.error('Analyze error:', error)
    showMessage('Failed to communicate with page. Try refreshing.', 'error')
  } finally {
    analyzeBtn.disabled = false
    analyzeBtn.textContent = '🎬 Analyze Current Video'
  }
})

historyBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('history/history.html') })
})

optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

// Initialize on load
document.addEventListener('DOMContentLoaded', init)
