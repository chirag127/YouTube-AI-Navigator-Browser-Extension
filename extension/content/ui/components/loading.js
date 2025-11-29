const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
export function showLoading(c, m) {
  l('showLoading:Start');
  try {
    if (!c) return;
    c.innerHTML = `<div class="yt-ai-loading"><div class="yt-ai-spinner"></div><div class="yt-ai-loading-text">${m}</div></div>`;
    l('showLoading:End');
  } catch (err) {
    e('Err:showLoading', err);
  }
}
export function showError(c, m) {
  l('showError:Start');
  try {
    if (!c) return;
    c.innerHTML = `<div class="yt-ai-error"><div class="yt-ai-error-icon">❌</div><div class="yt-ai-error-msg">${m}</div><button class="yt-ai-btn" onclick="document.getElementById('yt-ai-refresh-btn')?.click()">Try Again</button></div>`;
    l('showError:End');
  } catch (err) {
    e('Err:showError', err);
  }
}
export function showPlaceholder(c, m) {
  l('showPlaceholder:Start');
  try {
    if (!c) return;
    c.innerHTML = `<div class="yt-ai-placeholder">${m}</div>`;
    l('showPlaceholder:End');
  } catch (err) {
    e('Err:showPlaceholder', err);
  }
}
