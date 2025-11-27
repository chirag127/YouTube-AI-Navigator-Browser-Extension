import { ChunkingService } from '../services/ChunkingService.js'
import { GeminiService } from '../services/GeminiService.js'
import { SegmentClassificationService } from '../services/SegmentClassificationService.js'
import { StorageService } from '../services/StorageService.js'

const storageService = new StorageService()
const chunkingService = new ChunkingService()
let geminiService = null
let segmentClassificationService = null
let currentTranscriptText = '' // Store for chat context
let currentClassifiedSegments = [] // Store classified segments

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
  segmentClassificationService = new SegmentClassificationService(geminiService, chunkingService)

  // Initialize models (optional, but good for warm-up)
  try {
    await geminiService.fetchAvailableModels()
  } catch (e) {
    console.warn('Failed to fetch models on init:', e)
  }

  // 2. Tab Switching Logic
  for (const btn of tabBtns) {
    btn.addEventListener('click', () => {
      // Remove active class from all
      for (const b of tabBtns) {
        b.classList.remove('active')
      }
      for (const c of tabContents) {
        c.classList.remove('active')
      }

      // Add active class to clicked
      btn.classList.add('active')
      const tabId = btn.getAttribute('data-tab')
      document.getElementById(`${tabId}-tab`).classList.add('active')
    })
  }

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
    console.log('YouTube AI Master: Active tab:', tab?.url)
    if (!tab || !tab.url.includes('youtube.com/watch')) {
      throw new Error('Please open a YouTube video page.')
    }

    const urlParams = new URLSearchParams(new URL(tab.url).search)
    const videoId = urlParams.get('v')
    console.log('YouTube AI Master: Extracted video ID:', videoId)
    if (!videoId) throw new Error('Could not find Video ID.')

    // 2. Fetch Metadata & Transcript via content script
    statusDiv.textContent = 'Fetching transcript...'

    // Get metadata
    const metadataResponse = await chrome.tabs.sendMessage(tab.id, {
      action: 'GET_METADATA',
      videoId,
    })
    if (metadataResponse.error) {
      throw new Error(`Metadata fetch failed: ${metadataResponse.error}`)
    }
    const metadata = metadataResponse.metadata

    // Get transcript
    const transcriptResponse = await chrome.tabs.sendMessage(tab.id, {
      action: 'GET_TRANSCRIPT',
      videoId,
    })
    if (transcriptResponse.error) {
      // Handle user-friendly error messages
      if (transcriptResponse.error.includes('does not have captions')) {
        throw new Error(
          'This video does not have captions/subtitles. Please try a different video that has closed captions enabled.'
        )
      }
      if (transcriptResponse.error.includes('Transcript analysis failed')) {
        throw new Error(transcriptResponse.error)
      }
      throw new Error(`Unable to analyze video: ${transcriptResponse.error}`)
    }
    const transcript = transcriptResponse.transcript

    // Store for Chat
    currentTranscriptText = transcript.map((s) => s.text).join(' ')
    if (!currentTranscriptText.trim()) {
      throw new Error('Transcript text is empty. Please try a different video or language.')
    }

    // 3.5. Classify Segments (Smart Skipping)
    statusDiv.textContent = 'Classifying segments...'
    console.log('Classifying transcript segments...')
    const classifiedSegments = await segmentClassificationService.classifyTranscript(transcript)
    currentClassifiedSegments = classifiedSegments
    console.log('Segments classified:', classifiedSegments.length)

    // Render Transcript with classifications
    renderTranscript(classifiedSegments)

    // Send segments to content script for visual markers and auto-skip
    chrome.tabs
      .sendMessage(tab.id, {
        action: 'SHOW_SEGMENTS',
        segments: classifiedSegments,
      })
      .catch((err) => console.warn('Failed to send segments to content script:', err))

    // 3. Get Options
    const options = await chrome.storage.local.get(['summaryLength', 'targetLanguage'])
    const summaryOptions = {
      length: options.summaryLength || 'Medium',
      language: options.targetLanguage || 'English',
    }

    // 4. Generate Content
    statusDiv.textContent = 'Analyzing content...'

    // Use combined analysis to save API calls
    const analysis = await geminiService.generateComprehensiveAnalysis(
      currentTranscriptText,
      summaryOptions
    )

    // Render Summary & FAQ immediately
    renderMarkdown(analysis.summary, summaryContent)

    // 5. Analyze Comments (Sequential to avoid rate limits)
    statusDiv.textContent = 'Analyzing comments...'

    // Fetch comments
    const commentsResponse = await chrome.tabs
      .sendMessage(tab.id, { action: 'GET_COMMENTS' })
      .catch(() => ({ comments: [] }))
    const comments = commentsResponse?.comments || []

    let commentsAnalysis = 'No comments found.'
    if (comments.length > 0) {
      try {
        commentsAnalysis = await geminiService.analyzeCommentSentiment(comments)
      } catch (e) {
        console.warn('Comment analysis failed:', e)
        commentsAnalysis = 'Failed to analyze comments.'
      }
    }

    // Combine FAQ and Comments for Insights
    const insightsHtml = `
      <h3>Key Insights</h3>
      ${marked.parse(analysis.insights)}
      <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
      <h3>Comments Analysis</h3>
      ${marked.parse(commentsAnalysis)}
      <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
      <h3>Frequently Asked Questions</h3>
      ${marked.parse(analysis.faq)}
    `
    insightsContent.innerHTML = insightsHtml

    statusDiv.textContent = 'Done!'

    // 6. Save to Storage
    await storageService.saveTranscript(videoId, metadata, transcript, analysis.summary)
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

function renderTranscript(segments) {
  transcriptContainer.innerHTML = ''
  for (const segment of segments) {
    const div = document.createElement('div')
    div.className = `transcript-segment ${getSegmentClass(segment.label)}`

    const time = document.createElement('span')
    time.className = 'timestamp'
    time.textContent = formatTime(segment.start)

    const text = document.createElement('span')
    text.className = 'text'
    text.textContent = segment.text

    // Add segment label if it exists
    if (segment.label) {
      const label = document.createElement('span')
      label.className = 'segment-label'
      label.textContent = segment.label
      label.title = getSegmentDescription(segment.label)
      div.appendChild(label)
    }

    div.appendChild(time)
    div.appendChild(text)

    div.addEventListener('click', () => {
      seekVideo(segment.start)
    })

    transcriptContainer.appendChild(div)
  }
}

// Helper function to get CSS class for segment type
function getSegmentClass(label) {
  const classMap = {
    Sponsor: 'segment-sponsor',
    'Interaction Reminder': 'segment-interaction',
    'Self Promotion': 'segment-self-promo',
    'Unpaid Promotion': 'segment-unpaid-promo',
    Highlight: 'segment-highlight',
    'Preview/Recap': 'segment-preview',
    'Hook/Greetings': 'segment-hook',
    'Tangents/Jokes': 'segment-tangent',
    Content: 'segment-content',
  }
  return classMap[label] || 'segment-unknown'
}

// Helper function to get description for segment type
function getSegmentDescription(label) {
  const descriptions = {
    Sponsor: 'Paid advertisement or sponsorship',
    'Interaction Reminder': 'Asking viewers to like/subscribe/share',
    'Self Promotion': "Promoting creator's own products/services",
    'Unpaid Promotion': 'Shout-outs to other creators/channels',
    Highlight: 'Most important or interesting part',
    'Preview/Recap': 'Coming up next or previously on',
    'Hook/Greetings': 'Video introduction or greeting',
    'Tangents/Jokes': 'Off-topic content or humor',
    Content: 'Main video content',
  }
  return descriptions[label] || 'Unknown segment type'
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
