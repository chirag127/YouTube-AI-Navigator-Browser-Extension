# Invidious CORS & Transcript Service Fix

## Issues Fixed

### 1. Missing transcriptService Reference

**Error:** `ReferenceError: transcriptService is not defined`

**Root Cause:** The `handleFetchTranscript` function referenced a non-existent `YouTubeTranscriptService` class that was never imported.

**Solution:** Modified `handleFetchTranscript` to delegate to the existing `handleFetchInvidiousTranscript` function.

### 2. CORS Policy Blocking Invidious Requests

**Error:** `Access to fetch at 'https://[invidious-instance]' has been blocked by CORS policy`

**Root Cause:** Chrome extensions need explicit host permissions to make cross-origin requests.

**Solution:** Added Invidious instance domains to `host_permissions` in manifest.json.

### 3. Relative Caption URL Issue

**Error:** `Failed to fetch` when trying to get captions

**Root Cause:** Invidious API returns relative URLs for captions (e.g., `/api/v1/captions/...`), but the code was trying to fetch them directly.

**Solution:** Added logic to detect relative URLs and prepend the instance base URL before fetching captions.

### 4. Unreliable Instance Selection

**Issue:** Some instances return 401/403 errors or require authentication

**Solution:**

-   Updated fallback instances to use more reliable public instances
-   Added filtering to skip instances that require authentication
-   Improved instance selection based on uptime and API availability

## Files Modified

1. **extension/background/service-worker.js**

    - Fixed transcriptService reference
    - Fixed relative caption URL handling
    - Updated fallback instances
    - Added authentication filtering

2. **extension/manifest.json**
    - Added Invidious instance domains to host_permissions

## Reliable Fallback Instances

-   `https://inv.perditum.com`
-   `https://invidious.privacyredirect.com`
-   `https://invidious.fdn.fr`
-   `https://iv.ggtyler.dev`
-   `https://invidious.protokolla.fi`

## Testing

After reloading the extension:

-   ✅ No more transcriptService errors
-   ✅ No more CORS errors
-   ✅ Successful caption fetching
-   ✅ Better instance selection

Reload the extension and test on a YouTube video.

## Additional Fixes (Latest)

### 5. Content Security Policy (CSP) Violation

**Error:** `Loading the script 'https://cdn.jsdelivr.net/npm/marked/...' violates CSP`

**Root Cause:** Extension was trying to load marked.js from CDN, which violates Chrome extension CSP.

**Solution:** Replaced CDN-loaded marked.js with a lightweight inline markdown parser that supports all needed features (headers, bold, italic, code, links, lists).

### 6. Improved Caption Fetch Error Handling

Added better error handling and logging for caption fetching, including:

-   Increased timeout to 10 seconds
-   Added Accept headers for VTT format
-   Better error messages to identify fetch failures

## Latest Changes Summary

Files modified:

-   `extension/background/service-worker.js` - Improved caption fetch error handling
-   `extension/lib/marked-loader.js` - Replaced CDN loader with inline parser

After reloading:

-   ✅ No CSP violations
-   ✅ Better caption fetch debugging
-   ✅ Markdown rendering works without external dependencies
