/**
 * YouTube AI Master - Background Service Worker
 * Handles extension lifecycle, message passing, and AI processing
 */

import { ChunkingService } from '../services/chunking/index.js'
import { GeminiService } from '../services/gemini/index.js'
import { SegmentClassificationService } from '../services/segments/index.js'
import { StorageService } from '../services/storage/index.js'

// Service instances (initialized on demand)
let geminiService, chunkingService, segmentClassificationService, storageService
let keepAliveInterval = null

async function initializeServices(apiKey) {
  if (!apiKey) throw new Error('API Key required')
  geminiService = new GeminiService(apiKey)
  chunkingService = new ChunkingService()
  segmentClassificationService = new SegmentClassificationService(geminiService, chunkingService)
  storageService = new StorageService()
  try { await geminiService.fetchAvailableModels() } catch (e) { }
}

// Keep service worker alive during long operations
function startKeepAlive() {
  if (keepAliveInterval) return
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => { })
  }, 20000)
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval)
    keepAliveInterval = null
  }
}

async function getApiKey() {
  const s = await chrome.storage.sync.get('apiKey')
  if (s.apiKey) return s.apiKey
  const l = await chrome.storage.local.get('geminiApiKey')
  return l.geminiApiKey || null
}

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('YouTube AI Master installed')
    chrome.runtime.openOptionsPage()
  } else if (details.reason === 'update') {
    console.log('YouTube AI Master updated to version', chrome.runtime.getManifest().version)
  }
})

// Message handler for communication between content scripts and background
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const action = request.action || request.type
  console.log('Background received message:', action)

    // Handle async operations
    ; (async () => {
      try {
        switch (action) {
          case 'TEST':
            sendResponse({ success: true, message: 'Background script is running' })
            break

          case 'GET_SETTINGS':
            await handleGetSettings(sendResponse)
            break

          case 'FETCH_TRANSCRIPT':
            await handleFetchTranscript(request, sendResponse)
            break

          case 'ANALYZE_VIDEO':
            await handleAnalyzeVideo(request, sendResponse)
            break

          case 'ANALYZE_COMMENTS':
            await handleAnalyzeComments(request, sendResponse)
            break

          case 'GENERATE_SUMMARY':
            await handleGenerateSummary(request, sendResponse)
            break

          case 'CLASSIFY_SEGMENTS':
            await handleClassifySegments(request, sendResponse)
            break

          case 'CHAT_WITH_VIDEO':
            await handleChatWithVideo(request, sendResponse)
            break

          case 'SAVE_TO_HISTORY':
            await handleSaveToHistory(request, sendResponse)
            break

          case 'GET_METADATA':
            await handleGetMetadata(request, sendResponse)
            break

          case 'FETCH_INVIDIOUS_TRANSCRIPT':
            await handleFetchInvidiousTranscript(request, sendResponse)
            break

          case 'FETCH_INVIDIOUS_METADATA':
            await handleFetchInvidiousMetadata(request, sendResponse)
            break

          default:
            console.warn('Unknown message type:', action)
            sendResponse({ success: false, error: 'Unknown message type' })
        }
      } catch (error) {
        console.error('Background handler error:', error)
        sendResponse({ success: false, error: error.message })
      }
    })()

  return true // Keep channel open for async response
})

/**
 * Get user settings from storage
 */
async function handleGetSettings(sendResponse) {
  const settings = await chrome.storage.sync.get([
    'apiKey',
    'model',
    'summaryLength',
    'outputLanguage',
    'customPrompt',
    'enableSegments',
    'autoSkipSponsors',
    'autoSkipIntros',
    'saveHistory',
  ])
  sendResponse({ success: true, data: settings })
}

/**
 * Fetch YouTube transcript using multiple methods
 */
async function handleFetchTranscript(request, sendResponse) {
  const { videoId, lang = 'en' } = request
  console.log(`[Transcript] 🔍 Fetching transcript for ${videoId}, lang: ${lang}`)

  // Try multiple methods in order
  const methods = [
    { name: 'Invidious API', fn: () => handleFetchInvidiousTranscript(request, { send: (r) => r }) },
    { name: 'YouTube Direct API', fn: () => fetchYouTubeDirectAPI(videoId, lang) },
  ]

  let lastError = null

  for (const method of methods) {
    try {
      console.log(`[Transcript] Trying ${method.name}...`)
      const result = await method.fn()

      if (result.success && result.data) {
        console.log(`[Transcript] ✅ ${method.name} succeeded`)
        sendResponse(result)
        return
      }
    } catch (e) {
      lastError = e
      console.warn(`[Transcript] ${method.name} failed:`, e.message)
    }
  }

  sendResponse({
    success: false,
    error: lastError?.message || 'All transcript fetch methods failed'
  })
}

/**
 * Fetch transcript directly from YouTube API
 */
async function fetchYouTubeDirectAPI(videoId, lang = 'en') {
  const formats = ['json3', 'srv3']

  for (const fmt of formats) {
    try {
      const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=${fmt}`
      const response = await fetch(url)

      if (!response.ok) continue

      if (fmt === 'json3') {
        const data = await response.json()
        if (data.events) {
          const segments = data.events
            .filter(e => e.segs)
            .map(e => ({
              start: e.tStartMs / 1000,
              duration: (e.dDurationMs || 0) / 1000,
              text: e.segs.map(s => s.utf8).join('')
            }))

          if (segments.length > 0) {
            return { success: true, data: segments }
          }
        }
      } else {
        const xmlText = await response.text()
        const segments = parseXML(xmlText)
        if (segments.length > 0) {
          return { success: true, data: segments }
        }
      }
    } catch (e) {
      console.warn(`[YouTube API] Format ${fmt} failed:`, e.message)
    }
  }

  throw new Error('YouTube Direct API failed')
}

/**
 * Parse XML format captions
 */
function parseXML(xmlText) {
  const segments = []
  const regex = /<text start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g
  let match

  while ((match = regex.exec(xmlText)) !== null) {
    const start = parseFloat(match[1])
    const duration = match[2] ? parseFloat(match[2]) : 0
    const text = decodeHTMLEntities(match[3])

    if (text.trim()) {
      segments.push({ start, duration, text })
    }
  }

  return segments
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  }

  return text.replace(/&[^;]+;/g, match => entities[match] || match)
}

/**
 * Full video analysis: transcript + summary + segments
 */
async function handleAnalyzeVideo(request, sendResponse) {
  const { transcript, metadata, options = {} } = request
  startKeepAlive()

  try {
    const apiKey = await getApiKey()
    if (!apiKey) {
      sendResponse({
        success: false,
        error: 'API Key not configured. Please set your Gemini API key in extension options.',
      })
      return
    }

    await initializeServices(apiKey)

    // Format transcript for AI (plain text for analysis)
    const plainText = transcript.map((t) => t.text).join(' ')

    // Generate comprehensive analysis (summary + FAQ + insights)
    const analysis = await geminiService.generateComprehensiveAnalysis(plainText, {
      length: options.length || 'Medium',
      language: options.language || 'English',
    })

    // Classify segments
    let segments = []
    try {
      segments = await segmentClassificationService.classifyTranscript(transcript)
    } catch (e) {
      console.warn('Segment classification failed:', e)
    }

    // Save to history if enabled
    const settings = await chrome.storage.sync.get('saveHistory')
    if (settings.saveHistory !== false && storageService) {
      try {
        await storageService.saveTranscript(
          metadata?.videoId || 'unknown',
          metadata,
          transcript,
          analysis.summary
        )
      } catch (e) {
        console.warn('Failed to save to history:', e)
      }
    }

    sendResponse({
      success: true,
      data: {
        summary: analysis.summary,
        faq: analysis.faq,
        insights: analysis.insights,
        segments,
      },
    })
  } finally {
    stopKeepAlive()
  }
}

/**
 * Analyze YouTube comments sentiment
 */
async function handleAnalyzeComments(request, sendResponse) {
  const { comments } = request

  const apiKey = await getApiKey()
  if (!apiKey) {
    sendResponse({ success: false, error: 'API Key not configured' })
    return
  }

  await initializeServices(apiKey)

  const analysis = await geminiService.analyzeCommentSentiment(comments)
  sendResponse({ success: true, analysis })
}

/**
 * Generate AI summary
 */
async function handleGenerateSummary(request, sendResponse) {
  const { transcript, settings } = request

  const apiKey = settings?.apiKey || (await getApiKey())
  if (!apiKey) {
    sendResponse({ success: false, error: 'API Key not configured' })
    return
  }

  await initializeServices(apiKey)

  const summary = await geminiService.generateSummary(
    transcript,
    settings?.customPrompt,
    settings?.model,
    { length: settings?.summaryLength, language: settings?.outputLanguage }
  )

  sendResponse({ success: true, data: summary })
}

/**
 * Classify video segments
 */
async function handleClassifySegments(request, sendResponse) {
  const { transcript, settings } = request

  const apiKey = settings?.apiKey || (await getApiKey())
  if (!apiKey) {
    sendResponse({ success: false, error: 'API Key not configured' })
    return
  }

  await initializeServices(apiKey)

  const segments = await segmentClassificationService.classifyTranscript(transcript)
  sendResponse({ success: true, data: segments })
}

/**
 * Chat with video content
 */
async function handleChatWithVideo(request, sendResponse) {
  const { question, context } = request

  const apiKey = await getApiKey()
  if (!apiKey) {
    sendResponse({ success: false, error: 'API Key not configured' })
    return
  }

  await initializeServices(apiKey)

  const answer = await geminiService.chatWithVideo(question, context)
  sendResponse({ success: true, answer })
}

/**
 * Save summary to history
 */
async function handleSaveToHistory(request, sendResponse) {
  const { videoId, title, summary, timestamp } = request.data || request

  const result = await chrome.storage.local.get('summaryHistory')
  const history = result.summaryHistory || []

  history.unshift({
    videoId,
    title,
    summary,
    timestamp: timestamp || Date.now(),
  })

  // Keep only last 100 entries
  const trimmedHistory = history.slice(0, 100)
  await chrome.storage.local.set({ summaryHistory: trimmedHistory })

  sendResponse({ success: true })
}

/**
 * Get metadata - now handled by content script
 * This is kept for backward compatibility but shouldn't be called
 */
async function handleGetMetadata(request, sendResponse) {
  const { videoId } = request
  console.warn('[Background] GET_METADATA called - this should be handled by content script')

  // Return a basic response to prevent errors
  sendResponse({
    success: true,
    data: {
      title: 'YouTube Video',
      author: 'Unknown Channel',
      viewCount: 'Unknown',
      videoId: videoId
    }
  })
}

/**
 * Fetch transcript from Invidious API (CORS-free)
 */
async function handleFetchInvidiousTranscript(request, sendResponse) {
  const { videoId, lang = 'en' } = request
  console.log(`[Invidious] 🔍 Fetching transcript for ${videoId}, lang: ${lang}`)

  const instances = await getInvidiousInstances()
  console.log(`[Invidious] 📡 Testing ${instances.length} instances`)

  let lastError = null

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i]
    try {
      console.log(`[Invidious] 🔄 Trying instance ${i + 1}/${instances.length}: ${inst}`)

      // First, get video data to find captions
      const videoUrl = `${inst}/api/v1/videos/${videoId}`
      console.log(`[Invidious] 📥 Fetching video data: ${videoUrl}`)

      const videoResponse = await fetch(videoUrl, {
        signal: AbortSignal.timeout(8000)
      })

      if (!videoResponse.ok) {
        console.warn(`[Invidious] ⚠️ Instance ${inst} returned HTTP ${videoResponse.status}`)
        continue
      }

      const videoData = await videoResponse.json()
      console.log(`[Invidious] 📊 Video data received:`, {
        title: videoData.title,
        captionsCount: videoData.captions?.length || 0
      })

      if (!videoData.captions || videoData.captions.length === 0) {
        console.warn(`[Invidious] ⚠️ No captions available for this video`)
        lastError = new Error('No captions available')
        continue
      }

      // Find caption track
      let captionTrack = videoData.captions.find(c => c.language_code === lang)
      if (!captionTrack) {
        console.log(`[Invidious] 🔄 Language '${lang}' not found, using first available: ${videoData.captions[0].language_code}`)
        captionTrack = videoData.captions[0]
      }

      console.log(`[Invidious] 📝 Selected caption:`, {
        label: captionTrack.label,
        languageCode: captionTrack.language_code,
        url: captionTrack.url
      })

      // Fetch caption data (handle relative URLs)
      const captionUrl = captionTrack.url.startsWith('http')
        ? captionTrack.url
        : `${inst}${captionTrack.url}`

      console.log(`[Invidious] 📥 Fetching captions from: ${captionUrl}`)

      const captionResponse = await fetch(captionUrl, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'Accept': 'text/vtt,text/plain,*/*'
        }
      })

      if (!captionResponse.ok) {
        console.warn(`[Invidious] ⚠️ Caption fetch failed: HTTP ${captionResponse.status}`)
        continue
      }

      const captionText = await captionResponse.text()
      console.log(`[Invidious] 📄 Caption data received: ${captionText.length} bytes`)

      // Parse captions
      const segments = parseVTT(captionText)
      console.log(`[Invidious] ✅ Successfully parsed ${segments.length} segments`)

      sendResponse({ success: true, data: segments })
      return
    } catch (e) {
      lastError = e
      console.error(`[Invidious] ❌ Instance ${inst} failed:`, e.message)
      continue
    }
  }

  console.error(`[Invidious] ❌ All instances failed. Last error:`, lastError?.message)
  sendResponse({
    success: false,
    error: lastError?.message || 'All Invidious instances failed'
  })
}

/**
 * Fetch metadata from Invidious API
 */
async function handleFetchInvidiousMetadata(request, sendResponse) {
  const { videoId } = request
  console.log(`[Invidious] 🔍 Fetching metadata for ${videoId}`)

  const instances = await getInvidiousInstances()

  for (let i = 0; i < instances.length; i++) {
    const inst = instances[i]
    try {
      console.log(`[Invidious] 🔄 Trying instance ${i + 1}/${instances.length}: ${inst}`)

      const url = `${inst}/api/v1/videos/${videoId}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(8000)
      })

      if (!response.ok) {
        console.warn(`[Invidious] ⚠️ Instance ${inst} returned HTTP ${response.status}`)
        continue
      }

      const data = await response.json()

      const metadata = {
        videoId: data.videoId,
        title: data.title,
        author: data.author,
        authorId: data.authorId,
        lengthSeconds: data.lengthSeconds,
        duration: data.lengthSeconds,
        viewCount: data.viewCount,
        likeCount: data.likeCount,
        published: data.published,
        description: data.description,
        keywords: data.keywords || [],
        genre: data.genre,
        captionsAvailable: (data.captions?.length || 0) > 0,
        availableLanguages: data.captions?.map(c => c.language_code) || []
      }

      console.log(`[Invidious] ✅ Metadata fetched successfully:`, {
        title: metadata.title,
        author: metadata.author,
        captionsAvailable: metadata.captionsAvailable
      })

      sendResponse({ success: true, data: metadata })
      return
    } catch (e) {
      console.error(`[Invidious] ❌ Instance ${inst} failed:`, e.message)
      continue
    }
  }

  console.error(`[Invidious] ❌ All instances failed for metadata`)
  sendResponse({
    success: false,
    error: 'Failed to fetch metadata from Invidious'
  })
}

/**
 * Get Invidious instances (with caching)
 */
let cachedInstances = null
let instancesCacheTime = 0
const INSTANCES_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getInvidiousInstances() {
  const now = Date.now()

  // Return cached instances if still valid
  if (cachedInstances && (now - instancesCacheTime) < INSTANCES_CACHE_DURATION) {
    console.log(`[Invidious] 📦 Using cached instances (${cachedInstances.length} instances)`)
    return cachedInstances
  }

  console.log(`[Invidious] 🔍 Fetching fresh instance list from live API...`)

  // Hardcoded fallback instances (reliable public instances)
  const fallbackInstances = [
    'https://inv.perditum.com',
    'https://invidious.privacyredirect.com',
    'https://invidious.fdn.fr',
    'https://iv.ggtyler.dev',
    'https://invidious.protokolla.fi'
  ]

  try {
    const r = await fetch('https://api.invidious.io/instances.json?sort_by=type,users', {
      signal: AbortSignal.timeout(8000),
    })

    if (!r.ok) {
      console.warn(`[Invidious] ⚠️ Instance API returned HTTP ${r.status}, using fallback`)
      cachedInstances = fallbackInstances
      instancesCacheTime = now
      return fallbackInstances
    }

    const data = await r.json()
    console.log(`[Invidious] 📊 Received ${data.length} total instances from API`)

    // Filter for working HTTPS instances with API enabled and not down
    const instances = data
      .filter((entry) => {
        const [_domain, info] = entry

        // Must be HTTPS
        if (info?.type !== 'https') return false

        // API must not be explicitly disabled (api: false means disabled)
        // If api is null or undefined, we assume it's enabled
        if (info?.api === false) return false

        // Must not be marked as down
        if (info?.monitor?.down === true) return false

        // Must have a valid URI
        if (!info?.uri) return false

        // Skip instances that require authentication (if indicated in API)
        if (info?.api?.restricted === true) return false

        return true
      })
      .sort((a, b) => {
        // Sort by uptime (higher is better)
        const uptimeA = a[1]?.monitor?.uptime || 0
        const uptimeB = b[1]?.monitor?.uptime || 0
        return uptimeB - uptimeA
      })
      .slice(0, 15) // Take top 15 instances
      .map((entry) => entry[1].uri)

    if (instances.length > 0) {
      console.log(`[Invidious] ✅ Fetched ${instances.length} active instances with API enabled`)
      console.log(`[Invidious] 📋 Top instances:`, instances.slice(0, 5))
      cachedInstances = instances
      instancesCacheTime = now
      return instances
    } else {
      console.warn(`[Invidious] ⚠️ No valid instances found in API response, using fallback`)
      cachedInstances = fallbackInstances
      instancesCacheTime = now
      return fallbackInstances
    }
  } catch (e) {
    console.error(`[Invidious] ❌ Failed to fetch instances from API:`, e.message)
    cachedInstances = fallbackInstances
    instancesCacheTime = now
    return fallbackInstances
  }
}

/**
 * Parse VTT format captions
 */
function parseVTT(vttText) {
  console.log(`[Parser] 🔍 Parsing VTT format (${vttText.length} bytes)`)

  const segments = []
  const lines = vttText.split('\n')
  let i = 0
  let segmentCount = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Look for timestamp line (e.g., "00:00:00.000 --> 00:00:02.000")
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map((t) => t.trim())
      const start = parseVTTTime(startStr)
      const end = parseVTTTime(endStr)

      i++
      let text = ''

      // Collect text lines until empty line or next timestamp
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        text += lines[i].trim() + ' '
        i++
      }

      // Clean up text (remove HTML tags, extra spaces)
      text = text.trim().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')

      if (text) {
        segments.push({
          start,
          duration: end - start,
          text
        })
        segmentCount++
      }
    }
    i++
  }

  console.log(`[Parser] ✅ Parsed ${segmentCount} VTT segments`)
  return segments
}

/**
 * Parse VTT timestamp to seconds
 * Supports: HH:MM:SS.mmm, MM:SS.mmm, SS.mmm
 */
function parseVTTTime(timestamp) {
  const parts = timestamp.split(':')

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    const [h, m, s] = parts
    return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s)
  } else if (parts.length === 2) {
    // MM:SS.mmm
    const [m, s] = parts
    return parseFloat(m) * 60 + parseFloat(s)
  } else {
    // SS.mmm
    return parseFloat(parts[0])
  }
}

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name)
})

console.log('YouTube AI Master service worker loaded')
