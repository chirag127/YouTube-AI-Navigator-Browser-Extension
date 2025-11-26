import { GeminiService } from '../services/GeminiService.js'
import { StorageService } from '../services/StorageService.js'
import { YouTubeTranscriptService } from '../services/YouTubeTranscriptService.js'

const transcriptService = new YouTubeTranscriptService()
const storageService = new StorageService()
let geminiService = null
let currentTranscriptText = '' // Store for chat context

// UI Elements
const analyzeBtn = document.getElementById('analyze-btn')
const statusDiv = document.getElementById('status')
const authWarning = document.getElementById('auth-warning')
const tabBtns = document.querySelectorAll('.tab-btn')
const tabContents = document.querySelectorAll('.tab-content')

// Content Containers
const summaryContent = document.getElementById('summary-content')
const insightsContent = document.getElementById('insights-content')
const transcriptContainer = document.getElementById('transcript-container')

// Chat Elements
const chatInput = document.getElementById('chat-input')
const chatSendBtn = document.getElementById('chat-send-btn')
const chatHistory = document.getElementById('chat-history')

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check Auth
  const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey')
  if (!geminiApiKey) {
    authWarning.style.display = 'block'
    analyzeBtn.disabled = true
    return
  }
  geminiService = new GeminiService(geminiApiKey)

  // Initialize models (optional, but good for warm-up)
  try {
    await geminiService.fetchAvailableModels()
  } catch (e) {
    console.warn('Failed to fetch models on init:', e)
  }

  // 2. Tab Switching Logic
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      tabBtns.forEach((b) => b.classList.remove('active'))
      tabContents.forEach((c) => c.classList.remove('active'))

      // Add active class to clicked
      btn.classList.add('active')
      const tabId = btn.getAttribute('data-tab')
      document.getElementById(`${tabId}-tab`).classList.add('active')
    })
  })

  // 3. Chat Event Listeners
  chatSendBtn.addEventListener('click', handleChatSubmit)
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  })
})

async function handleChatSubmit() {
  const question = chatInput.value.trim()
  if (!question) return

  if (!currentTranscriptText) {
    appendChatMessage(
      'ai',
      'Please analyze a video first so I have context to answer your question.'
    )
    return
  }

  // User Message
  appendChatMessage('user', question)
  chatInput.value = ''

  // AI Loading
  const loadingId = appendChatMessage('ai', 'Thinking...')

  try {
    const answer = await geminiService.chatWithVideo(question, currentTranscriptText)
    updateChatMessage(loadingId, answer)
  } catch (error) {
    updateChatMessage(loadingId, `Error: ${error.message}`)
  }
}

function appendChatMessage(role, text) {
  const div = document.createElement('div')
  div.className = `chat-message ${role}`
  div.id = `msg-${Date.now()}`
  div.textContent = text
  chatHistory.appendChild(div)
  chatHistory.scrollTop = chatHistory.scrollHeight
  return div.id
}

function updateChatMessage(id, text) {
  const div = document.getElementById(id)
  if (div) {
    div.innerHTML = marked.parse(text) // Use markdown for AI response
    chatHistory.scrollTop = chatHistory.scrollHeight
  }
}

analyzeBtn.addEventListener('click', async () => {
  try {
    statusDiv.textContent = 'Fetching video info...'
    statusDiv.className = ''
    analyzeBtn.disabled = true

    // Reset UI
    summaryContent.innerHTML = '<p style="text-align:center; color:#888;">Generating summary...</p>'
    insightsContent.innerHTML =
      '<p style="text-align:center; color:#888;">Generating insights...</p>'
    transcriptContainer.innerHTML =
      '<p style="text-align:center; color:#888;">Loading transcript...</p>'

    // 1. Get Active Tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.url.includes('youtube.com/watch')) {
      throw new Error('Please open a YouTube video page.')
    }

    const urlParams = new URLSearchParams(new URL(tab.url).search)
    const videoId = urlParams.get('v')
    if (!videoId) throw new Error('Could not find Video ID.')

    // 2. Fetch Metadata & Transcript
    statusDiv.textContent = 'Fetching transcript...'
    const metadata = await transcriptService.getVideoMetadata(videoId)
    const transcript = await transcriptService.getTranscript(videoId)

    // Store for Chat
    currentTranscriptText = transcript.map((s) => s.text).join(' ')

    // Render Transcript
    renderTranscript(transcript)

    // 3. Get Options
    const options = await chrome.storage.local.get(['summaryLength', 'targetLanguage'])
    const summaryOptions = {
      length: options.summaryLength || 'Medium',
      language: options.targetLanguage || 'English',
    }

    // 4. Generate Content (Parallel)
    statusDiv.textContent = 'Analyzing content...'

    const summaryPromise = geminiService.generateSummary(
      currentTranscriptText,
      undefined,
      null,
      summaryOptions
    )
    const faqPromise = geminiService.generateFAQ(currentTranscriptText)

    // Fetch comments
    const commentsResponse = await chrome.tabs
      .sendMessage(tab.id, { action: 'GET_COMMENTS' })
      .catch(() => ({ comments: [] }))
    const comments = commentsResponse?.comments || []

    let commentsPromise = Promise.resolve('No comments found.')
    if (comments.length > 0) {
      commentsPromise = geminiService.analyzeCommentSentiment(comments)
    }

    const [summary, faq, commentsAnalysis] = await Promise.all([
      summaryPromise,
      faqPromise,
      commentsPromise,
    ])

    // 5. Render Results
    renderMarkdown(summary, summaryContent)

    // Combine FAQ and Comments for Insights
    const insightsHtml = `
      <h3>Comments Analysis</h3>
      ${marked.parse(commentsAnalysis)}
      <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
      <h3>Frequently Asked Questions</h3>
      ${marked.parse(faq)}
    `
    insightsContent.innerHTML = insightsHtml

    statusDiv.textContent = 'Done!'

    // 6. Save to Storage
    await storageService.saveTranscript(videoId, metadata, transcript, summary)
  } catch (error) {
    console.error(error)
    statusDiv.textContent = `Error: ${error.message}`
    statusDiv.className = 'error'

    // Restore placeholders on error
    if (summaryContent.innerHTML.includes('Generating'))
      summaryContent.innerHTML = '<p class="error">Failed to generate.</p>'
  } finally {
    analyzeBtn.disabled = false
  }
})

function renderMarkdown(text, element) {
  if (typeof marked !== 'undefined') {
    element.innerHTML = marked.parse(text)
  } else {
    element.textContent = text
  }
}

function renderTranscript(transcript) {
  transcriptContainer.innerHTML = ''
  transcript.forEach((segment) => {
    const div = document.createElement('div')
    div.className = 'transcript-segment'

    const time = document.createElement('span')
    time.className = 'timestamp'
    time.textContent = formatTime(segment.start)

    const text = document.createElement('span')
    text.className = 'text'
    text.textContent = segment.text

    div.appendChild(time)
    div.appendChild(text)

    div.addEventListener('click', () => {
      seekVideo(segment.start)
    })

    transcriptContainer.appendChild(div)
  })
}

async function seekVideo(seconds) {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'SEEK_TO',
        timestamp: seconds,
      })
    }
  } catch (error) {
    console.error('Failed to send seek command:', error)
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
