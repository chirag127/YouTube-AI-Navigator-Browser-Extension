document.getElementById('save-btn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value
  const summaryLength = document.getElementById('summaryLength').value
  const targetLanguage = document.getElementById('targetLanguage').value

  chrome.storage.local.set(
    {
      geminiApiKey: apiKey,
      summaryLength: summaryLength,
      targetLanguage: targetLanguage,
    },
    () => {
      const status = document.getElementById('status')
      status.textContent = 'Options saved.'
      setTimeout(() => {
        status.textContent = ''
      }, 2000)
    }
  )
})

// Restore options
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['geminiApiKey', 'summaryLength', 'targetLanguage'], (items) => {
    if (items.geminiApiKey) {
      document.getElementById('apiKey').value = items.geminiApiKey
    }
    if (items.summaryLength) {
      document.getElementById('summaryLength').value = items.summaryLength
    }
    if (items.targetLanguage) {
      document.getElementById('targetLanguage').value = items.targetLanguage
    }
  })
})
