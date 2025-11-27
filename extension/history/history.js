/**
 * YouTube AI Master - History Page
 * View and manage saved video summaries
 */

import { StorageService } from '../services/StorageService.js'

const storageService = new StorageService()

// DOM Elements
const videoList = document.getElementById('video-list')
const searchInput = document.getElementById('search-input')
const noResults = document.getElementById('no-results')
const videoCount = document.getElementById('video-count')
const detailPlaceholder = document.getElementById('detail-placeholder')
const detailContent = document.getElementById('detail-content')
const detailActions = document.getElementById('detail-actions')
const openVideoBtn = document.getElementById('open-video-btn')
const exportBtn = document.getElementById('export-btn')
const importBtn = document.getElementById('import-btn')
const importFile = document.getElementById('import-file')

// State
let currentVideoId = null
let historyData = []

// Initialize
document.addEventListener('DOMContentLoaded', init)

async function init() {
  await loadHistory()
  setupEventListeners()
}

function setupEventListeners() {
  searchInput.addEventListener('input', handleSearch)
  exportBtn.addEventListener('click', handleExport)
  importBtn.addEventListener('click', () => importFile.click())
  importFile.addEventListener('change', handleImport)
  openVideoBtn.addEventListener('click', openCurrentVideo)
}

async function loadHistory() {
  historyData = await storageService.getHistory()
  renderList(historyData)
}

async function handleSearch(e) {
  const query = e.target.value.toLowerCase()

  if (!query) {
    renderList(historyData)
    return
  }

  const filtered = historyData.filter(
    (item) =>
      item.title?.toLowerCase().includes(query) || item.author?.toLowerCase().includes(query)
  )

  renderList(filtered)
}

function renderList(items) {
  videoList.innerHTML = ''
  videoCount.textContent = `${items.length} video${items.length !== 1 ? 's' : ''}`

  if (items.length === 0) {
    noResults.style.display = 'block'
    return
  }

  noResults.style.display = 'none'

  for (const item of items) {
    const li = document.createElement('li')
    li.className = 'video-item'
    if (item.videoId === currentVideoId) {
      li.classList.add('active')
    }

    const date = new Date(item.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

    li.innerHTML = `
            <div class="video-title">${escapeHtml(item.title || 'Untitled Video')}</div>
            <div class="video-meta">
                <span>👤 ${escapeHtml(item.author || 'Unknown')}</span>
                <span>📅 ${date}</span>
            </div>
            <div class="video-actions">
                <button class="btn btn-secondary view-btn" data-id="${item.videoId}">View</button>
                <button class="btn btn-danger delete-btn" data-id="${item.videoId}">Delete</button>
            </div>
        `

    // Event listeners
    li.querySelector('.view-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      viewVideo(item.videoId)
    })

    li.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation()
      deleteVideo(item.videoId)
    })

    li.addEventListener('click', () => viewVideo(item.videoId))

    videoList.appendChild(li)
  }
}

async function viewVideo(videoId) {
  currentVideoId = videoId

  // Update active state in list
  document.querySelectorAll('.video-item').forEach((item) => {
    item.classList.remove('active')
    if (item.querySelector(`[data-id="${videoId}"]`)) {
      item.classList.add('active')
    }
  })

  // Load full video data
  const videoData = await storageService.getTranscript(videoId)

  if (!videoData) {
    detailContent.innerHTML = '<p>Failed to load video data.</p>'
    detailContent.style.display = 'block'
    detailPlaceholder.style.display = 'none'
    return
  }

  // Show detail panel
  detailPlaceholder.style.display = 'none'
  detailContent.style.display = 'block'
  detailActions.style.display = 'block'

  // Render summary
  let html = ''

  if (videoData.metadata) {
    html += `
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${formatDuration(videoData.metadata.duration)}</div>
                    <div class="stat-label">Duration</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${formatViews(videoData.metadata.viewCount)}</div>
                    <div class="stat-label">Views</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${videoData.transcript?.length || 0}</div>
                    <div class="stat-label">Segments</div>
                </div>
            </div>
        `
  }

  if (videoData.summary) {
    html += '<h2>Summary</h2>'
    html += marked.parse(videoData.summary)
  } else {
    html += '<p>No summary available for this video.</p>'
  }

  detailContent.innerHTML = html
}

async function deleteVideo(videoId) {
  if (!confirm('Are you sure you want to delete this video from history?')) {
    return
  }

  await storageService.deleteVideo(videoId)

  // Clear detail if viewing deleted video
  if (currentVideoId === videoId) {
    currentVideoId = null
    detailPlaceholder.style.display = 'flex'
    detailContent.style.display = 'none'
    detailActions.style.display = 'none'
  }

  // Reload list
  await loadHistory()

  // Re-apply search filter if active
  if (searchInput.value) {
    handleSearch({ target: searchInput })
  }
}

function openCurrentVideo() {
  if (currentVideoId) {
    chrome.tabs.create({ url: `https://www.youtube.com/watch?v=${currentVideoId}` })
  }
}

async function handleExport() {
  try {
    const allData = []

    for (const item of historyData) {
      const fullData = await storageService.getTranscript(item.videoId)
      if (fullData) {
        allData.push(fullData)
      }
    }

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `youtube-ai-master-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()

    URL.revokeObjectURL(url)

    alert(`Exported ${allData.length} videos successfully!`)
  } catch (error) {
    console.error('Export error:', error)
    alert(`Failed to export data: ${error.message}`)
  }
}

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!Array.isArray(data)) {
      throw new Error('Invalid format: expected an array')
    }

    let imported = 0
    for (const item of data) {
      if (item.videoId && item.metadata) {
        await storageService.saveTranscript(
          item.videoId,
          item.metadata,
          item.transcript || [],
          item.summary
        )
        imported++
      }
    }

    await loadHistory()
    alert(`Imported ${imported} videos successfully!`)
  } catch (error) {
    console.error('Import error:', error)
    alert(`Failed to import data: ${error.message}`)
  }

  // Reset file input
  importFile.value = ''
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatViews(views) {
  if (!views) return '0'
  const num = Number.parseInt(views, 10)
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
