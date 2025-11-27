# Testing Transcript Extraction Methods

Quick guide to test all implemented transcript extraction methods.

## Prerequisites

1. Load the extension in Chrome/Edge
2. Navigate to any YouTube video with captions
3. Open Developer Console (F12)

## Quick Test

### Test Video IDs

Use these video IDs for testing (known to have captions):

-   `dQw4w9WgXcQ` - Rick Astley - Never Gonna Give You Up
-   `jNQXAC9IVRw` - Me at the zoo (first YouTube video)
-   `9bZkp7q19f0` - PSY - Gangnam Style

## Method 1: Browser Console Testing

### Step 1: Open Console

1. Navigate to a YouTube video
2. Press F12 to open Developer Tools
3. Go to Console tab

### Step 2: Run Quick Test

```javascript
// Test all methods for current video
const videoId = new URLSearchParams(window.location.search).get("v");
await transcriptTests.testAllMethods(videoId);
```

### Step 3: Compare Performance

```javascript
await transcriptTests.compareMethods(videoId);
```

### Step 4: Run Complete Test Suite

```javascript
await transcriptTests.runAllTests(videoId);
```

## Method 2: Extension Popup Testing

### Step 1: Open Extension

1. Click the extension icon in toolbar
2. Extension popup should open

### Step 2: Trigger Analysis

1. Click "Analyze Video" or similar button
2. Watch console for transcript extraction logs

### Step 3: Check Results

-   Transcript should appear in the UI
-   Check console for method used
-   Verify segment count

## Method 3: Manual Method Testing

### Test Invidious API

```javascript
const response = await chrome.runtime.sendMessage({
    action: "FETCH_INVIDIOUS_TRANSCRIPT",
    videoId: "dQw4w9WgXcQ",
    lang: "en",
});
console.log("Invidious:", response);
```

### Test YouTube Direct API

```javascript
const url =
    "https://www.youtube.com/api/timedtext?v=dQw4w9WgXcQ&lang=en&fmt=json3";
const response = await fetch(url);
const data = await response.json();
console.log("YouTube Direct:", data.events?.length, "segments");
```

### Test DOM Parser

```javascript
const tracks =
    window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer
        ?.captionTracks;
console.log("Available tracks:", tracks?.length);
console.log(
    "Languages:",
    tracks?.map((t) => t.languageCode)
);
```

### Test XHR Interceptor

```javascript
// Check interceptor status
transcriptTests.testInterceptor();

// Get intercepted transcript (if available)
const videoId = new URLSearchParams(window.location.search).get("v");
const transcript = transcriptInterceptor.getTranscript(videoId, "en");
console.log("Intercepted:", transcript?.length, "segments");
```

## Method 4: Automated Testing

### Run All Tests

```javascript
// Get current video ID
const videoId = new URLSearchParams(window.location.search).get("v");

// Run complete test suite
const results = await transcriptTests.runAllTests(videoId);

// Check results
console.log("Test Results:", results);
```

### Benchmark Performance

```javascript
const videoId = new URLSearchParams(window.location.search).get("v");
const benchmark = await transcriptTests.benchmarkExtraction(videoId, 5);
console.log("Average:", benchmark.avg.toFixed(2), "ms");
console.log("Min:", benchmark.min.toFixed(2), "ms");
console.log("Max:", benchmark.max.toFixed(2), "ms");
```

## Expected Results

### Successful Extraction

```
[TranscriptExtractor] ℹ️ Extracting transcript for dQw4w9WgXcQ, lang: en
[TranscriptExtractor] 🔍 Trying method: interceptor
[TranscriptExtractor] 🔍 Trying method: invidious
[Invidious] 🔍 Fetching transcript for dQw4w9WgXcQ, lang: en
[Invidious] 📡 Testing 15 instances
[Invidious] 🔄 Trying instance 1/15: https://inv.perditum.com
[Invidious] 📥 Fetching video data: https://inv.perditum.com/api/v1/videos/dQw4w9WgXcQ
[Invidious] 📊 Video data received: { title: "...", captionsCount: 1 }
[Invidious] 📝 Selected caption: { label: "English", languageCode: "en" }
[Invidious] 📥 Fetching captions from: https://...
[Invidious] 📄 Caption data received: 12345 bytes
[Invidious] ✅ Successfully parsed 156 segments
[TranscriptExtractor] ✅ Method 'invidious' succeeded with 156 segments
```

### Method Comparison Output

```
🏆 Performance Ranking:
1. interceptor: 5.23ms (156 segments)
2. youtube: 234.56ms (156 segments)
3. dom: 267.89ms (156 segments)
4. invidious: 1234.56ms (156 segments)
5. background: 1456.78ms (156 segments)

⚡ Fastest: interceptor (5.23ms)
```

## Troubleshooting

### No Captions Available

```javascript
// Check if video has captions
transcriptTests.testAvailableCaptions();

// Expected output:
// Has captions: true
// Available languages: 2
// Languages:
//   - English (en) [asr]
//   - Spanish (es) [manual]
```

### All Methods Failing

```javascript
// Test each method individually
const methods = ["interceptor", "invidious", "youtube", "background", "dom"];
for (const method of methods) {
    try {
        const result = await transcriptTests.testMethod(method, videoId);
        console.log(`✅ ${method} works:`, result.length, "segments");
        break;
    } catch (error) {
        console.log(`❌ ${method} failed:`, error.message);
    }
}
```

### CORS Errors

If you see CORS errors:

1. Use Invidious API (CORS-free)
2. Use Background Proxy
3. Check browser console for details

```javascript
// Force Invidious method
const transcript = await transcriptExtractor.extract(videoId, {
    preferredMethod: "invidious",
});
```

### Timeout Issues

```javascript
// Increase timeout
const transcript = await transcriptExtractor.extract(videoId, {
    timeout: 60000, // 60 seconds
});
```

## Verification Checklist

-   [ ] Extension loads without errors
-   [ ] Console shows no JavaScript errors
-   [ ] At least one method succeeds
-   [ ] Transcript segments are returned
-   [ ] Segments have start, duration, and text
-   [ ] Timestamps are in seconds (not milliseconds)
-   [ ] Text is properly decoded (no HTML entities)
-   [ ] Multiple languages are detected (if available)
-   [ ] Cache works (second request is faster)
-   [ ] Error handling works (invalid video ID)

## Performance Benchmarks

### Expected Performance

| Method           | Expected Time | Notes                  |
| ---------------- | ------------- | ---------------------- |
| XHR Interceptor  | < 10ms        | Only if already loaded |
| YouTube Direct   | 100-500ms     | May have CORS issues   |
| DOM Parser       | 100-500ms     | May have CORS issues   |
| Invidious API    | 500-3000ms    | Depends on instance    |
| Background Proxy | 500-3000ms    | Combines methods       |

### Run Benchmark

```javascript
const videoId = new URLSearchParams(window.location.search).get("v");
const results = await transcriptTests.benchmarkExtraction(videoId, 10);

console.log("Results over 10 iterations:");
console.log("Average:", results.avg.toFixed(2), "ms");
console.log("Min:", results.min.toFixed(2), "ms");
console.log("Max:", results.max.toFixed(2), "ms");
```

## Test Videos

### Videos with Different Caption Types

1. **Manual Captions**

    - Video ID: `dQw4w9WgXcQ`
    - Has: Manual English captions

2. **Auto-Generated Captions**

    - Video ID: `jNQXAC9IVRw`
    - Has: Auto-generated captions

3. **Multiple Languages**

    - Video ID: `9bZkp7q19f0`
    - Has: Multiple language options

4. **No Captions**
    - Find a video without captions
    - Should fail gracefully with clear error

## Debug Mode

### Enable Verbose Logging

```javascript
// All methods include detailed logging by default
// Check console for:
// - [TranscriptExtractor] logs
// - [XHR-Interceptor] logs
// - [Invidious] logs
// - [Method X] logs
```

### Check Interceptor Status

```javascript
const stats = transcriptInterceptor.getStats();
console.log("Interceptor initialized:", stats.isInitialized);
console.log("Transcripts cached:", stats.transcripts);
console.log("Metadata cached:", stats.metadata);
```

### Check Cache Status

```javascript
// Extract transcript
const transcript = await transcriptExtractor.extract(videoId);

// Extract again (should be from cache)
const cached = await transcriptExtractor.extract(videoId);

// Should be much faster the second time
```

## Success Criteria

✅ **All tests pass** if:

1. At least one method successfully extracts transcript
2. Transcript has correct structure (start, duration, text)
3. No JavaScript errors in console
4. Error handling works for invalid inputs
5. Cache improves performance on repeated requests
6. Multiple languages are detected correctly
7. Formatting functions work correctly

## Reporting Issues

If tests fail, collect this information:

1. **Browser**: Chrome/Edge version
2. **Video ID**: The video being tested
3. **Console Logs**: Copy all console output
4. **Method Results**: Which methods succeeded/failed
5. **Error Messages**: Any error messages shown
6. **Network Tab**: Check for failed requests

## Next Steps

After successful testing:

1. ✅ Verify all methods work
2. ✅ Check performance is acceptable
3. ✅ Test error handling
4. ✅ Verify caching works
5. ✅ Test with different video types
6. ✅ Document any issues found
7. ✅ Optimize slow methods if needed

## Additional Resources

-   [METHODS.md](extension/content/transcript/METHODS.md) - Detailed method documentation
-   [USAGE.md](extension/content/transcript/USAGE.md) - Usage guide
-   [TRANSCRIPT_METHODS_IMPLEMENTATION.md](TRANSCRIPT_METHODS_IMPLEMENTATION.md) - Implementation summary
