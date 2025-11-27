# Implementation Guide - Priority Updates

This guide provides step-by-step instructions for implementing the recommended updates from the comprehensive review.

---

## ✅ COMPLETED (Phase 1 - Critical Updates)

### 1. Updated marked.js to v17.0.1

**File:** `extension/lib/marked-loader.js`

```javascript
const MARKED_CDN_URL =
    "https://cdn.jsdelivr.net/npm/marked@17.0.1/marked.min.js";
```

**Status:** ✅ Complete

### 2. Added Latest Gemini Models

**File:** `extension/services/gemini/models.js`

```javascript
getList() {
  return this.models.length > 0
    ? this.models.map(m => m.name.replace('models/', ''))
    : [
        'gemini-2.5-pro',        // NEW: Most powerful
        'gemini-2.0-flash',      // NEW: Fast & capable
        'gemini-2.5-flash-lite', // NEW: Lightweight
        'gemini-1.5-pro',        // Existing
        'gemini-1.5-flash'       // Existing
      ]
}
```

**Status:** ✅ Complete

### 3. Fixed Unused Variables

**File:** `extension/background/service-worker.js`

-   Changed `sender` to `_sender`
-   Removed unused `formattedTranscript`
-   Changed `domain` to `_domain`

**Status:** ✅ Complete

---

## 🔄 NEXT STEPS (Phase 2 - Reliability)

### 4. Add Service Worker Keep-Alive

**Purpose:** Prevent service worker from terminating during long-running operations (Chrome terminates after 30s inactivity).

**Implementation:**

```javascript
// extension/background/service-worker.js

// Add at the top of the file
let keepAliveInterval;

/**
 * Start keep-alive mechanism for long operations
 */
function startKeepAlive() {
    if (keepAliveInterval) return;

    console.log("[Service Worker] Starting keep-alive");
    keepAliveInterval = setInterval(() => {
        chrome.runtime.getPlatformInfo(() => {
            // This API call keeps the service worker alive
        });
    }, 20000); // Every 20 seconds (well before 30s timeout)
}

/**
 * Stop keep-alive mechanism
 */
function stopKeepAlive() {
    if (keepAliveInterval) {
        console.log("[Service Worker] Stopping keep-alive");
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
    }
}

// Update handleAnalyzeVideo function
async function handleAnalyzeVideo(request, sendResponse) {
    const { transcript, metadata, options = {} } = request;

    startKeepAlive(); // Start keep-alive

    try {
        const apiKey = await getApiKey();
        if (!apiKey) {
            sendResponse({
                success: false,
                error: "API Key not configured. Please set your Gemini API key in extension options.",
            });
            return;
        }

        await initializeServices(apiKey);

        // ... rest of the function

        sendResponse({
            success: true,
            data: {
                summary: analysis.summary,
                faq: analysis.faq,
                insights: analysis.insights,
                segments,
            },
        });
    } catch (error) {
        console.error("[Service Worker] Analysis error:", error);
        sendResponse({ success: false, error: error.message });
    } finally {
        stopKeepAlive(); // Always stop keep-alive
    }
}
```

**Files to modify:**

-   `extension/background/service-worker.js`

**Testing:**

1. Analyze a long video (>10 minutes)
2. Check console for keep-alive messages
3. Verify analysis completes without service worker termination

---

### 5. Implement Response Caching

**Purpose:** Reduce API calls and improve performance by caching analysis results.

**Implementation:**

```javascript
// extension/services/storage/cache.js (NEW FILE)

export class CacheService {
    constructor() {
        this.cachePrefix = "cache_";
        this.defaultTTL = 3600000; // 1 hour in milliseconds
    }

    /**
     * Get cached data
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached data or null if expired/missing
     */
    async get(key) {
        const cacheKey = this.cachePrefix + key;
        const result = await chrome.storage.local.get(cacheKey);
        const cached = result[cacheKey];

        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > cached.ttl) {
            await this.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * Set cached data
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    async set(key, data, ttl = this.defaultTTL) {
        const cacheKey = this.cachePrefix + key;
        await chrome.storage.local.set({
            [cacheKey]: {
                data,
                timestamp: Date.now(),
                ttl,
            },
        });
    }

    /**
     * Delete cached data
     * @param {string} key - Cache key
     */
    async delete(key) {
        const cacheKey = this.cachePrefix + key;
        await chrome.storage.local.remove(cacheKey);
    }

    /**
     * Clear all cache
     */
    async clear() {
        const all = await chrome.storage.local.get(null);
        const cacheKeys = Object.keys(all).filter((k) =>
            k.startsWith(this.cachePrefix)
        );
        await chrome.storage.local.remove(cacheKeys);
    }
}
```

**Usage in service-worker.js:**

```javascript
import { CacheService } from "../services/storage/cache.js";

const cacheService = new CacheService();

async function handleAnalyzeVideo(request, sendResponse) {
    const { transcript, metadata, options = {} } = request;
    const videoId = metadata?.videoId;

    // Try to get from cache
    if (videoId) {
        const cached = await cacheService.get(`analysis_${videoId}`);
        if (cached) {
            console.log("[Cache] Returning cached analysis for", videoId);
            sendResponse({ success: true, data: cached, fromCache: true });
            return;
        }
    }

    startKeepAlive();

    try {
        // ... perform analysis

        const result = {
            summary: analysis.summary,
            faq: analysis.faq,
            insights: analysis.insights,
            segments,
        };

        // Cache the result
        if (videoId) {
            await cacheService.set(`analysis_${videoId}`, result);
        }

        sendResponse({ success: true, data: result, fromCache: false });
    } finally {
        stopKeepAlive();
    }
}
```

**Files to create:**

-   `extension/services/storage/cache.js`

**Files to modify:**

-   `extension/background/service-worker.js`

**Testing:**

1. Analyze a video
2. Analyze the same video again
3. Verify second analysis is instant (from cache)
4. Check console for cache hit messages

---

### 6. Enhanced Error Handling

**Purpose:** Provide better error messages and recovery options.

**Implementation:**

```javascript
// extension/services/errors/handler.js (NEW FILE)

export class ErrorHandler {
    /**
     * Handle and format errors for user display
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     * @returns {Object} Formatted error response
     */
    static handle(error, context = "Unknown") {
        console.error(`[${context}] Error:`, error);

        // API Key errors
        if (error.message.includes("API Key")) {
            return {
                title: "API Key Required",
                message:
                    "Please set your Gemini API key in the extension options.",
                action: "Open Options",
                actionHandler: () => chrome.runtime.openOptionsPage(),
            };
        }

        // Network errors
        if (
            error.message.includes("fetch") ||
            error.message.includes("network")
        ) {
            return {
                title: "Network Error",
                message:
                    "Failed to connect to the service. Please check your internet connection and try again.",
                action: "Retry",
                recoverable: true,
            };
        }

        // Quota errors
        if (
            error.message.includes("quota") ||
            error.message.includes("rate limit")
        ) {
            return {
                title: "Rate Limit Exceeded",
                message:
                    "You have exceeded the API rate limit. Please wait a few minutes and try again.",
                action: "Wait",
                recoverable: true,
            };
        }

        // Transcript errors
        if (
            error.message.includes("captions") ||
            error.message.includes("transcript")
        ) {
            return {
                title: "No Captions Available",
                message:
                    "This video does not have captions or subtitles. Please try a different video.",
                action: null,
                recoverable: false,
            };
        }

        // Generic error
        return {
            title: "Error",
            message: error.message || "An unexpected error occurred.",
            action: "Retry",
            recoverable: true,
        };
    }

    /**
     * Create user-friendly error response
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     * @returns {Object} Response object
     */
    static createResponse(error, context) {
        const handled = this.handle(error, context);
        return {
            success: false,
            error: handled.message,
            errorTitle: handled.title,
            errorAction: handled.action,
            recoverable: handled.recoverable,
            context,
        };
    }
}
```

**Usage:**

```javascript
import { ErrorHandler } from "../services/errors/handler.js";

async function handleAnalyzeVideo(request, sendResponse) {
    try {
        // ... analysis logic
    } catch (error) {
        const errorResponse = ErrorHandler.createResponse(
            error,
            "Video Analysis"
        );
        sendResponse(errorResponse);
    }
}
```

**Files to create:**

-   `extension/services/errors/handler.js`

**Files to modify:**

-   `extension/background/service-worker.js`
-   All handler functions

---

## 💡 OPTIONAL ENHANCEMENTS (Phase 3)

### 7. Keyboard Shortcuts

**Implementation:**

```javascript
// extension/sidepanel/sidepanel.js

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + Enter: Send chat message
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleChat();
    }

    // Ctrl/Cmd + K: Focus chat input
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        ci.focus();
    }

    // Ctrl/Cmd + R: Reanalyze video
    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        analyzeVideo();
    }

    // Escape: Clear chat input
    if (e.key === "Escape" && document.activeElement === ci) {
        ci.value = "";
        ci.blur();
    }
});

// Show keyboard shortcuts hint
const shortcutsHint = document.createElement("div");
shortcutsHint.className = "shortcuts-hint";
shortcutsHint.innerHTML = `
  <details>
    <summary>⌨️ Keyboard Shortcuts</summary>
    <ul>
      <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> - Send message</li>
      <li><kbd>Ctrl</kbd> + <kbd>K</kbd> - Focus chat</li>
      <li><kbd>Ctrl</kbd> + <kbd>R</kbd> - Reanalyze</li>
      <li><kbd>Esc</kbd> - Clear input</li>
    </ul>
  </details>
`;
document.querySelector(".content-area").prepend(shortcutsHint);
```

**CSS:**

```css
.shortcuts-hint {
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 12px;
    padding: 8px;
    background: var(--secondary-bg);
    border-radius: 4px;
}

.shortcuts-hint summary {
    cursor: pointer;
    user-select: none;
}

.shortcuts-hint ul {
    margin: 8px 0 0 0;
    padding-left: 20px;
}

.shortcuts-hint kbd {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 10px;
}
```

---

### 8. Export Functionality

**Implementation:**

```javascript
// extension/sidepanel/sidepanel.js

/**
 * Export summary as markdown file
 */
function exportSummary() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const videoId = new URL(tab.url).searchParams.get('v');

  // Get current analysis data
  const summaryText = sc.textContent;
  const insightsText = ic.textContent;

  // Create markdown content
  const markdown = `# YouTube Video Summary

**Video ID:** ${videoId}
**Exported:** ${new Date().toLocaleString()}

## Summary

${summaryText}

## Insights

${insightsText}

---
*Generated by YouTube AI Master*
`;

  // Create and download file
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `youtube-${videoId}-summary.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// Add export button
const exportBtn = document.createElement('button');
exportBtn.className = 'primary-btn';
exportBtn.textContent = '📥 Export Summary';
exportBtn.style.marginTop = '12px';
exportBtn.addEventListener('click', exportSummary);
document.querySelector('.action-bar').appendChild(exportBtn);
```

---

### 9. Progress Indicators

**Implementation:**

```javascript
// extension/sidepanel/sidepanel.js

/**
 * Update progress during analysis
 */
function updateProgress(stage, percent) {
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");

    if (!progressBar) {
        // Create progress bar if it doesn't exist
        const container = document.createElement("div");
        container.className = "progress-container";
        container.innerHTML = `
      <div class="progress-bar-bg">
        <div id="progress-bar" class="progress-bar"></div>
      </div>
      <div id="progress-text" class="progress-text"></div>
    `;
        st.appendChild(container);
    }

    progressBar.style.width = `${percent}%`;
    progressText.textContent = stage;
}

// Usage in analyzeVideo:
async function analyzeVideo() {
    try {
        updateProgress("Fetching video info", 10);
        // ... fetch metadata

        updateProgress("Fetching transcript", 30);
        // ... fetch transcript

        updateProgress("Analyzing content", 50);
        // ... generate analysis

        updateProgress("Classifying segments", 70);
        // ... classify segments

        updateProgress("Analyzing comments", 90);
        // ... analyze comments

        updateProgress("Complete!", 100);
    } catch (error) {
        // ... error handling
    }
}
```

**CSS:**

```css
.progress-container {
    margin-top: 12px;
}

.progress-bar-bg {
    width: 100%;
    height: 4px;
    background: var(--secondary-bg);
    border-radius: 2px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: var(--timestamp-color);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
    text-align: center;
}
```

---

## Testing Checklist

### Phase 1 (Completed)

-   [x] marked.js v17.0.1 loads correctly
-   [x] Gemini 2.5 Pro available in model list
-   [x] Gemini 2.0 Flash available in model list
-   [x] No console errors for unused variables

### Phase 2 (To Do)

-   [ ] Service worker stays alive during long analysis
-   [ ] Cache hit on second analysis of same video
-   [ ] Error messages are user-friendly
-   [ ] Retry works after network error

### Phase 3 (Optional)

-   [ ] Keyboard shortcuts work
-   [ ] Export creates valid markdown file
-   [ ] Progress bar updates smoothly
-   [ ] All features work on different videos

---

## Deployment Steps

1. **Test locally:**

    ```bash
    # Load unpacked extension in Chrome
    chrome://extensions/ → Load unpacked → Select extension folder
    ```

2. **Test on various videos:**

    - Short video (<5 min)
    - Long video (>30 min)
    - Video with no captions
    - Video with multiple languages

3. **Check console for errors:**

    - Open DevTools in extension pages
    - Check service worker console
    - Verify no errors or warnings

4. **Update version number:**

    ```json
    // extension/manifest.json
    {
        "version": "1.1.0" // Increment version
    }
    ```

5. **Create release notes:**

    - List all changes
    - Highlight new features
    - Note any breaking changes

6. **Package extension:**

    ```bash
    # Zip the extension folder
    zip -r youtube-ai-master-v1.1.0.zip extension/
    ```

7. **Submit to Chrome Web Store:**
    - Upload new version
    - Update store listing if needed
    - Submit for review

---

## Support & Maintenance

### Monitoring

-   Check Chrome Web Store reviews
-   Monitor error reports
-   Track API usage and costs

### Updates

-   Keep dependencies updated
-   Monitor Gemini API changes
-   Update marked.js quarterly

### Documentation

-   Update README with new features
-   Maintain changelog
-   Document API changes

---

**Questions or issues?** Check the comprehensive review document or create an issue in the repository.
