import { StorageService } from '../services/StorageService.js'

const storageService = new StorageService()
const videoList = document.getElementById('video-list')
const searchInput = document.getElementById('search-input')
const noResults = document.getElementById('no-results')

document.addEventListener('DOMContentLoaded', loadHistory)
searchInput.addEventListener('input', handleSearch)

async function loadHistory() {
  const history = await storageService.getHistory()
  renderList(history)
}

async function handleSearch(e) {
  const query = e.target.value
  const results = await storageService.searchHistory(query)
  renderList(results)
}

function renderList(items) {
  videoList.innerHTML = ''

  if (items.length === 0) {
    noResults.style.display = 'block'
    return
  }

  noResults.style.display = 'none'

  items.forEach((item) => {
    const li = document.createElement('li')
    li.className = 'video-item'

    const date = new Date(item.timestamp).toLocaleDateString()

    li.innerHTML = `
      <div class="video-info">
        <div class="video-title" data-id="${item.videoId}">${item.title}</div>
        <div class="video-meta">
          ${item.author || 'Unknown Author'} • Saved on ${date}
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-delete" data-id="${item.videoId}">Delete</button>
      </div>
    `

    // Add event listeners
    li.querySelector('.video-title').addEventListener('click', () => openTranscript(item.videoId))
    li.querySelector('.btn-delete').addEventListener('click', (e) => deleteItem(e, item.videoId))

    videoList.appendChild(li)
  })
}

function openTranscript(videoId) {
  // For now, maybe just log it or open a detail view.
  // In a real app, this would navigate to a transcript view page.
  console.log('Open transcript for:', videoId)
  // Placeholder: Alert for now
  alert(`Opening transcript for video ID: ${videoId}`)
}

async function deleteItem(e, videoId) {
  if (confirm('Are you sure you want to delete this transcript?')) {
    await storageService.deleteVideo(videoId)
    // Refresh list based on current search
    const query = searchInput.value
    const results = await storageService.searchHistory(query)
    renderList(results)
  }
}
