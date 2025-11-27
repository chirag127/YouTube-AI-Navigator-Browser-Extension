# Transcript Extraction - Quick Reference

One-page reference for all transcript extraction methods.

## 🚀 Quick Start

```javascript
import transcriptExtractor from "./content/transcript/extractor.js";

// Extract transcript (automatic method selection)
const transcript = await transcriptExtractor.extract("dQw4w9WgXcQ");
```

## 📋 All Methods

| #   | Method           | Speed      | Reliability | CORS-Free | File               |
| --- | ---------------- | ---------- | ----------- | --------- | ------------------ |
| 0   | XHR Interceptor  | ⚡⚡⚡⚡⚡ | ⭐⭐⭐      | ✅        | xhr-interceptor.js |
| 1   | Invidious API    | ⚡⚡⚡     | ⭐⭐⭐⭐⭐  | ✅        | service-worker.js  |
| 2   | YouTube Direct   | ⚡⚡⚡⚡   | ⭐⭐⭐      | ❌        | service.js         |
| 3   | Background Proxy | ⚡⚡⚡     | ⭐⭐⭐⭐    | ✅        | service-worker.js  |
| 4   | DOM Parser       | ⚡⚡⚡⚡   | ⭐⭐⭐⭐    | ❌        | service.js         |

## 🎯 Common Use Cases

### Basic Extraction

```javascript
const transcript = await transcriptExtractor.extract(videoId);
```

### With Language

```javascript
const transcript = await transcriptExtractor.extract(videoId, { lang: "es" });
```

### Preferred Method

```javascript
const transcript = await transcriptExtractor.extract(videoId, {
    preferredMethod: "invidious",
});
```

### Check Captions First

```javascript
if (transcriptExtractor.hasCaptions()) {
    const transcript = await transcriptExtractor.extract(videoId);
}
```

### Get Available Languages

```javascript
const languages = transcriptExtractor.getAvailableLanguages();
// [{ code: 'en', name: 'English', kind: 'asr' }, ...]
```

### Format Output

```javascript
// With timestamps
const formatted = transcriptExtractor.formatWithTimestamps(transcript);
// [0:00] First segment
// [0:05] Second segment

// Plain text
const plainText = transcriptExtractor.formatPlainText(transcript);
// First segment Second segment
```

## 🧪 Testing

### Test All Methods

```javascript
await transcriptTests.testAllMethods("dQw4w9WgXcQ");
```

### Compare Performance

```javascript
await transcriptTests.compareMethods("dQw4w9WgXcQ");
```

### Run Complete Suite

```javascript
await transcriptTests.runAllTests("dQw4w9WgXcQ");
```

## 🔧 Configuration

### Options Object

```javascript
{
  lang: 'en',              // Language code
  preferredMethod: null,   // 'interceptor', 'invidious', 'youtube', 'background', 'dom'
  useCache: true,          // Use cached results
  timeout: 30000          // Timeout in milliseconds
}
```

## 📊 Data Structure

### Transcript Segment

```javascript
{
  start: 0,        // Start time in seconds (float)
  duration: 2.5,   // Duration in seconds (float)
  text: "Hello"    // Decoded text (string)
}
```

### Language Object

```javascript
{
  code: 'en',           // Language code
  name: 'English',      // Display name
  kind: 'asr'          // 'asr' (auto) or 'manual'
}
```

## 🎨 API Reference

### TranscriptExtractor

```javascript
// Extract transcript
await transcriptExtractor.extract(videoId, options);

// Check captions
transcriptExtractor.hasCaptions();

// Get languages
transcriptExtractor.getAvailableLanguages();

// Get tracks
transcriptExtractor.getAvailableTracks();

// Format
transcriptExtractor.formatWithTimestamps(transcript);
transcriptExtractor.formatPlainText(transcript);

// Cache
transcriptExtractor.clearCache();
```

### XHR Interceptor

```javascript
// Initialize (auto-initialized)
transcriptInterceptor.init();

// Get transcript
transcriptInterceptor.getTranscript(videoId, lang);

// Get languages
transcriptInterceptor.getAvailableLanguages(videoId);

// Get metadata
transcriptInterceptor.getMetadata(videoId);

// Get stats
transcriptInterceptor.getStats();

// Clear
transcriptInterceptor.clear();
```

### TranscriptService

```javascript
import { getTranscript, getMetadata, hasCaptions } from "./service.js";

// Get transcript
const transcript = await getTranscript(videoId, lang);

// Get metadata
const metadata = await getMetadata(videoId);

// Check captions
const available = hasCaptions();
```

## 🐛 Error Handling

```javascript
try {
    const transcript = await transcriptExtractor.extract(videoId);
} catch (error) {
    if (error.message.includes("No captions")) {
        // Video has no captions
    } else if (error.message.includes("Timeout")) {
        // Request timed out
    } else {
        // Other error
    }
}
```

## ⚡ Performance Tips

1. **Use Cache**: Enable caching for repeated requests
2. **Check First**: Use `hasCaptions()` before extraction
3. **Prefer Interceptor**: Fastest when available
4. **Set Timeouts**: Prevent hanging on slow connections
5. **Clear Cache**: Periodically clear to prevent memory buildup

## 🔒 Security

-   ✅ Input validation for video IDs
-   ✅ Timeout protection
-   ✅ CORS bypass through service worker
-   ✅ No sensitive data logging
-   ✅ Safe HTML entity decoding

## 📝 Console Commands

```javascript
// Get current video ID
const videoId = new URLSearchParams(window.location.search).get("v");

// Test all methods
await transcriptTests.testAllMethods(videoId);

// Test specific method
await transcriptTests.testMethod("invidious", videoId);

// Compare methods
await transcriptTests.compareMethods(videoId);

// Check interceptor
transcriptTests.testInterceptor();

// Check captions
transcriptTests.testAvailableCaptions();

// Benchmark
await transcriptTests.benchmarkExtraction(videoId, 5);

// Run all tests
await transcriptTests.runAllTests(videoId);
```

## 📚 Documentation Files

-   **METHODS.md** - Detailed technical documentation
-   **USAGE.md** - Usage guide with examples
-   **TESTING_TRANSCRIPT_METHODS.md** - Testing guide
-   **TRANSCRIPT_METHODS_IMPLEMENTATION.md** - Implementation summary
-   **TRANSCRIPT_METHODS_DIAGRAM.md** - Architecture diagrams
-   **TRANSCRIPT_EXTRACTION_COMPLETE.md** - Completion summary

## 🎯 Priority Order

1. **XHR Interceptor** - Check if already loaded (< 10ms)
2. **Invidious API** - Primary method (500-3000ms)
3. **YouTube Direct** - Fast but may have CORS (100-500ms)
4. **Background Proxy** - Reliable fallback (500-2000ms)
5. **DOM Parser** - Last resort (100-500ms)

## 🔗 Integration

### Content Script

```javascript
import { getTranscript } from "./transcript/service.js";
const transcript = await getTranscript(videoId, "en");
```

### Popup/Sidepanel

```javascript
const response = await chrome.runtime.sendMessage({
    action: "GET_TRANSCRIPT",
    videoId: "dQw4w9WgXcQ",
});
```

### Service Worker

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_TRANSCRIPT") {
        handleFetchTranscript(request, sendResponse);
        return true;
    }
});
```

## 🎬 Test Videos

-   `dQw4w9WgXcQ` - Rick Astley (Manual captions)
-   `jNQXAC9IVRw` - Me at the zoo (Auto-generated)
-   `9bZkp7q19f0` - Gangnam Style (Multiple languages)

## ✅ Checklist

-   [ ] Extension loaded
-   [ ] No console errors
-   [ ] At least one method works
-   [ ] Segments have correct structure
-   [ ] Timestamps in seconds
-   [ ] Text properly decoded
-   [ ] Multiple languages detected
-   [ ] Cache works
-   [ ] Error handling works

## 🆘 Troubleshooting

| Issue       | Solution                           |
| ----------- | ---------------------------------- |
| No captions | Check `hasCaptions()`              |
| CORS errors | Use `preferredMethod: 'invidious'` |
| Timeout     | Increase `timeout` option          |
| All fail    | Run `testAllMethods()`             |
| Slow        | Enable caching                     |

## 📞 Support

1. Check documentation in `extension/content/transcript/`
2. Run tests: `transcriptTests.runAllTests(videoId)`
3. Check console logs
4. Review troubleshooting in USAGE.md

---

**Status**: ✅ Complete and Ready
**Version**: 1.0.0
**Methods**: 5/5 (100%)
**Tests**: Passing ✅
**Docs**: Complete ✅
