# Logging Guide - YouTube AI Master Extension

## Overview

This extension now features comprehensive logging throughout the codebase to make debugging easier and track the flow of data through different API methods.

## Log Format

All logs follow a consistent format:

```
[Component] Icon Message
```

### Icons Used

-   🔍 - Searching/Looking up
-   ✅ - Success
-   ❌ - Error/Failure
-   ⚠️ - Warning
-   ℹ️ - Information
-   🔄 - Retry/Attempting
-   📡 - Network request
-   📥 - Downloading/Fetching
-   📊 - Data received
-   📝 - Processing
-   📄 - File/Document
-   📦 - Cached data
-   🔧 - Configuration

## Components with Logging

### 1. Invidious API Service (`extension/services/api/invidious.js`)

**Log Prefix:** `[Invidious]`

**Key Log Points:**

-   Instance discovery and testing
-   Video data fetching
-   Transcript/caption fetching
-   Caption format parsing
-   Error handling for each instance

**Example Logs:**

```javascript
[Invidious] 🔍 Fetching transcript for: dQw4w9WgXcQ (lang: en)
[Invidious] 📡 Testing instance: https://invidious.io.lol
[Invidious] ✅ Found working instance: https://invidious.io.lol
[Invidious] 📊 Video data fetched successfully
[Invidious] 📝 Selected caption track: English (en)
[Invidious] ✅ Transcript parsed successfully: 245 segments
```

### 2. Transcript Service (`extension/content/transcript/service.js`)

**Log Prefix:** `[TranscriptService]`

**Key Log Points:**

-   Method selection and priority
-   Timing information for each method
-   Fallback behavior
-   Success/failure for each attempt

**Example Logs:**

```javascript
[TranscriptService] ℹ️ Fetching transcript for video: dQw4w9WgXcQ, language: en
[TranscriptService] ℹ️ Attempting method 1/4: Invidious API
[TranscriptService] ✅ Invidious API succeeded in 1234.56ms with 245 segments
```

### 3. Background Service Worker (`extension/background/service-worker.js`)

**Log Prefix:** `[Invidious]` or `[Parser]`

**Key Log Points:**

-   Message handling
-   Instance list fetching and caching
-   VTT parsing
-   Metadata extraction

**Example Logs:**

```javascript
[Invidious] 🔍 Fetching transcript for dQw4w9WgXcQ, lang: en
[Invidious] 📡 Testing 6 instances
[Invidious] 🔄 Trying instance 1/6: https://invidious.io.lol
[Invidious] 📥 Fetching video data: https://invidious.io.lol/api/v1/videos/dQw4w9WgXcQ
[Invidious] 📊 Video data received: { title: "...", captionsCount: 2 }
[Parser] 🔍 Parsing VTT format (12345 bytes)
[Parser] ✅ Parsed 245 VTT segments
```

## Debugging Workflow

### 1. Open Browser Console

**Chrome/Edge:**

-   Press `F12` or `Ctrl+Shift+I`
-   Go to "Console" tab

### 2. Filter Logs

Use the console filter to focus on specific components:

```
[Invidious]        - Only Invidious API logs
[TranscriptService] - Only transcript service logs
[Parser]           - Only parser logs
```

### 3. Common Issues and Log Patterns

#### Issue: No Captions Available

**Look for:**

```
[Invidious] ⚠️ No captions available for this video
[TranscriptService] ❌ Invidious API failed: No captions available
```

**Solution:** Video doesn't have captions. Try a different video.

#### Issue: All Instances Failed

**Look for:**

```
[Invidious] ❌ Instance https://... failed: HTTP 500
[Invidious] ❌ All instances failed. Last error: ...
```

**Solution:** Invidious instances may be down. Check fallback methods.

#### Issue: Parsing Failed

**Look for:**

```
[Parser] 🔍 Parsing VTT format (0 bytes)
[Parser] ✅ Parsed 0 VTT segments
```

**Solution:** Caption data is empty or malformed.

### 4. Performance Monitoring

Logs include timing information:

```javascript
[TranscriptService] ✅ Invidious API succeeded in 1234.56ms with 245 segments
```

This helps identify slow API calls or network issues.

## API Method Priority

The extension tries methods in this order:

1. **Invidious API** (Primary) - CORS-free, reliable
2. **YouTube Direct API** - May have CORS issues
3. **Background Proxy** - Fallback through service worker
4. **DOM Parser** - Last resort, parses page data

Each method is logged with its attempt number and result.

## Log Levels

### Debug Logs

Use `console.debug()` for detailed information:

```javascript
logger.debug("Request URL:", url);
logger.debug("Available captions:", captions);
```

### Info Logs

Use `console.log()` for general information:

```javascript
logger.info("Fetching transcript for video: dQw4w9WgXcQ");
```

### Warning Logs

Use `console.warn()` for non-critical issues:

```javascript
logger.warn("Language not found, using fallback");
```

### Error Logs

Use `console.error()` for failures:

```javascript
logger.error("Failed to fetch transcript:", error.message);
```

## Enabling Verbose Logging

To enable more detailed logging, open the browser console and run:

```javascript
// Enable debug logs
localStorage.setItem("DEBUG", "true");

// Disable debug logs
localStorage.removeItem("DEBUG");
```

Then reload the extension.

## Log Analysis Tips

### 1. Track Request Flow

Follow a single video ID through the logs:

```
[TranscriptService] ℹ️ Fetching transcript for video: dQw4w9WgXcQ
  ↓
[Invidious] 🔍 Fetching transcript for: dQw4w9WgXcQ
  ↓
[Invidious] 📡 Testing instance: https://...
  ↓
[Invidious] ✅ Found working instance
  ↓
[Parser] 🔍 Parsing VTT format
  ↓
[Parser] ✅ Parsed 245 VTT segments
  ↓
[TranscriptService] ✅ Invidious API succeeded
```

### 2. Identify Bottlenecks

Look for long durations:

```
[TranscriptService] ✅ Method succeeded in 5432.10ms  // Slow!
```

### 3. Check Instance Health

Monitor which instances work:

```
[Invidious] ✅ Found working instance: https://invidious.io.lol
[Invidious] 📦 Using cached instance (6 instances)
```

## Troubleshooting Checklist

When debugging issues, check these logs in order:

1. ✅ Is the video ID correct?

    ```
    [TranscriptService] ℹ️ Fetching transcript for video: [VIDEO_ID]
    ```

2. ✅ Are Invidious instances responding?

    ```
    [Invidious] 🔍 Fetching fresh instance list...
    [Invidious] ✅ Fetched 6 active instances
    ```

3. ✅ Does the video have captions?

    ```
    [Invidious] 📊 Video data received: { captionsCount: 2 }
    ```

4. ✅ Is the caption data valid?

    ```
    [Invidious] 📄 Caption data received: 12345 bytes
    ```

5. ✅ Did parsing succeed?
    ```
    [Parser] ✅ Parsed 245 VTT segments
    ```

## Contributing

When adding new features, follow these logging guidelines:

1. Use the Logger class for consistent formatting
2. Include relevant context in log messages
3. Log both success and failure cases
4. Add timing information for async operations
5. Use appropriate log levels (debug, info, warn, error)

### Example:

```javascript
const logger = new Logger("MyComponent");

async function myFunction() {
    logger.info("Starting operation");
    const startTime = performance.now();

    try {
        const result = await doSomething();
        const duration = (performance.now() - startTime).toFixed(2);
        logger.success(`Operation completed in ${duration}ms`);
        return result;
    } catch (error) {
        logger.error("Operation failed:", error.message);
        throw error;
    }
}
```

## Support

If you encounter issues:

1. Check the console logs
2. Copy relevant log messages
3. Report the issue with logs included
4. Include video ID and browser version

The comprehensive logging makes it much easier to diagnose and fix issues!
