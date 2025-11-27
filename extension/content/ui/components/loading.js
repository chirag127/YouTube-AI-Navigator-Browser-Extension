export function showLoading(c, m) { if (!c) return; c.innerHTML = `<div class="yt-ai-loading"><div class="yt-ai-spinner"></div><div class="yt-ai-loading-text">${m}</div></div>` }
export function showError(c, m) { if (!c) return; c.innerHTML = `<div class="yt-ai-error"><div class="yt-ai-error-icon">❌</div><div class="yt-ai-error-msg">${m}</div><button class="yt-ai-btn" onclick="document.getElementById('yt-ai-refresh-btn')?.click()">Try Again</button></div>` }
export function showPlaceholder(c, m) { if (!c) return; c.innerHTML = `<div class="yt-ai-placeholder">${m}</div>` }
