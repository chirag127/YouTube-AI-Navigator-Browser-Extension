/**
 * YouTube AI Master - Options Page Script
 * Handles user settings and API key configuration
 */

// Default settings
const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  summaryLength: 'medium',
  outputLanguage: 'en',
  customPrompt: '',
  autoAnalyze: true,
  enableSegments: true,
  autoSkipSponsors: false,
  autoSkipIntros: false,
  saveHistory: true,
}

// DOM Elements
const elements = {
  apiKey: document.getElementById('apiKey'),
  modelSelect: document.getElementById('modelSelect'),
  summaryLength: document.getElementById('summaryLength'),
  outputLanguage: document.getElementById('outputLanguage'),
  customPrompt: document.getElementById('customPrompt'),
  autoAnalyze: document.getElementById('autoAnalyze'),
  enableSegments: document.getElementById('enableSegments'),
  autoSkipSponsors: document.getElementById('autoSkipSponsors'),
  autoSkipIntros: document.getElementById('autoSkipIntros'),
  saveHistory: document.getElementById('saveHistory'),
  saveBtn: document.getElementById('saveBtn'),
  testBtn: document.getElementById('testBtn'),
  clearHistory: document.getElementById('clearHistory'),
  statusMessage: document.getElementById('statusMessage'),
}

/**
 * Load settings from Chrome storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS)

    elements.apiKey.value = result.apiKey || ''
    elements.modelSelect.value = result.model || DEFAULT_SETTINGS.model
    elements.summaryLength.value = result.summaryLength || DEFAULT_SETTINGS.summaryLength
    elements.outputLanguage.value = result.outputLanguage || DEFAULT_SETTINGS.outputLanguage
    elements.customPrompt.value = result.customPrompt || ''
    elements.autoAnalyze.checked = result.autoAnalyze !== false
    elements.enableSegments.checked = result.enableSegments !== false
    elements.autoSkipSponsors.checked = result.autoSkipSponsors === true
    elements.autoSkipIntros.checked = result.autoSkipIntros === true
    elements.saveHistory.checked = result.saveHistory !== false
  } catch (error) {
    console.error('Error loading settings:', error)
    showStatus('Failed to load settings', 'error')
  }
}

/**
 * Save settings to Chrome storage
 */
async function saveSettings() {
  try {
    const settings = {
      apiKey: elements.apiKey.value.trim(),
      model: elements.modelSelect.value,
      summaryLength: elements.summaryLength.value,
      outputLanguage: elements.outputLanguage.value,
      customPrompt: elements.customPrompt.value.trim(),
      autoAnalyze: elements.autoAnalyze.checked,
      enableSegments: elements.enableSegments.checked,
      autoSkipSponsors: elements.autoSkipSponsors.checked,
      autoSkipIntros: elements.autoSkipIntros.checked,
      saveHistory: elements.saveHistory.checked,
    }

    // Validate API key
    if (!settings.apiKey) {
      showStatus('Please enter your Gemini API key', 'error')
      elements.apiKey.focus()
      return
    }

    // Save to sync storage (primary)
    await chrome.storage.sync.set(settings)

    // Also save API key to local storage for sidepanel compatibility
    await chrome.storage.local.set({
      geminiApiKey: settings.apiKey,
      summaryLength: settings.summaryLength,
      targetLanguage: settings.outputLanguage,
    })

    showStatus('Settings saved successfully!', 'success')
  } catch (error) {
    console.error('Error saving settings:', error)
    showStatus('Failed to save settings', 'error')
  }
}

/**
 * Test API connection with Gemini
 */
async function testApiConnection() {
  const apiKey = elements.apiKey.value.trim()
  const model = elements.modelSelect.value

  if (!apiKey) {
    showStatus('Please enter your API key first', 'error')
    elements.apiKey.focus()
    return
  }

  showStatus('Testing API connection...', 'info')
  elements.testBtn.disabled = true

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Hello! Please respond with "API connection successful"',
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'API request failed')
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (responseText) {
      showStatus('✅ API connection successful! Your key is working.', 'success')
    } else {
      throw new Error('Unexpected API response format')
    }
  } catch (error) {
    console.error('API test failed:', error)
    showStatus(`❌ API test failed: ${error.message}`, 'error')
  } finally {
    elements.testBtn.disabled = false
  }
}

/**
 * Clear all saved history
 */
async function clearAllHistory() {
  if (
    !confirm('Are you sure you want to clear all saved summaries? This action cannot be undone.')
  ) {
    return
  }

  try {
    await chrome.storage.local.remove('summaryHistory')
    showStatus('History cleared successfully', 'success')
  } catch (error) {
    console.error('Error clearing history:', error)
    showStatus('Failed to clear history', 'error')
  }
}

/**
 * Show status message
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'success', 'error', or 'info'
 */
function showStatus(message, type = 'info') {
  elements.statusMessage.textContent = message
  elements.statusMessage.className = `status-message show ${type}`

  // Auto-hide after 5 seconds for success/info messages
  if (type !== 'error') {
    setTimeout(() => {
      elements.statusMessage.classList.remove('show')
    }, 5000)
  }
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  elements.saveBtn.addEventListener('click', saveSettings)
  elements.testBtn.addEventListener('click', testApiConnection)
  elements.clearHistory.addEventListener('click', clearAllHistory)

  // Auto-save on Enter key in API key field
  elements.apiKey.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveSettings()
    }
  })
}

/**
 * Initialize the options page
 */
async function init() {
  await loadSettings()
  initializeEventListeners()
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
