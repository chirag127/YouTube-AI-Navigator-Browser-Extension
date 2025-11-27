# Invidious API Implementation Summary

## Overview

The YouTube AI Master extension now uses the **Invidious API as the primary method** for fetching video transcripts and metadata. This provides a reliable, CORS-free alternative to direct YouTube API calls.

## What Changed

### 1. New Invidious API Service (`extension/services/api/invidious.js`)

A comprehensive service for interacting with Invidious instances:

-   **Live Instance Discovery**: Fetches working instances from `https://api.invidious.io/instances.json`
-   **Smart Filtering**: Only uses HTTPS instances with API enabled and not marked as down
-   **Uptime Sorting**: Prioritizes instances with higher uptime
-   **Caching**: Caches instance list for 5 minutes to reduce API calls
-   **Fallback Instances**: Hardcoded reliable instances if API fetch fails
-   **Comprehensive Logging**: Detailed logs for debugging

**Key Functions:**

-   `fetchVideoData(videoId, region)` - Get video metadata
-   `fetchTranscript(videoId, lang)` - Get video transcript/captions
-   `fetchMetadata(videoId)` - Get structured metadata
-   `searchVideos(query, options)` - Search for videos

### 2. Updated Transcript Service (`extension/content/transcript/service.js`)

**New Priority Order:**

1. ✅ **Invidious API** (Primary)
2. YouTube Direct API (Fallback)
3. Background Proxy (Fallback)
4. DOM Parser (Last Resort)

**Enhanced Logging:**

-   Method name and attempt number
-   Timing information (milliseconds)
-   Success/failure status
-   Segment count

### 3. Enhanced Background Service Worker (`extension/background/service-worker.js`)

**New Message Handlers:**

-   `FETCH_INVIDIOUS_TRANSCRIPT` - Fetch transcript via Invidious
-   `FETCH_INVIDIOUS_METADATA` - Fetch metadata via Invidious

**Improved Instance Management:**

-   Live fetching from `https://api.invidious.io/instances.json`
-   Filters for HTTPS, API-enabled, and online instances
-   Sorts by uptime for reliability
-   Caches for 5 minutes

**Better VTT Parsing:**

-   Handles multiple timestamp formats
-   Removes HTML tags from captions
-   Proper error handling

### 4. Fixed Comment Analysis Bug (`extension/content/ui/renderers/comments.js`)

Fixed the `Cannot set properties of null (setting 'commentAnalysis')` error by initializing `state.analysisData` before setting properties.

## Live Instance Fetching

The extension now fetches Invidious instances dynamically from the official API:

```
https://api.invidious.io/instances.json?sort_by=type,users
```

### Filtering Criteria

Instances must meet ALL of these requirements:

1. ✅ **Type**: Must be `https` (secure connection)
2. ✅ **API**: Must not be explicitly disabled (`api !== false`)
3. ✅ **Status**: Must not be marked as down (`monitor.down !== true`)
4. ✅ **URI**: Must have a valid URI

### Sorting

Instances are sorted by **uptime** (highest first) to prioritize the most reliable ones.

### Current Fallback Instances

Based on the live API data, these are the most reliable instances:

1. `https://inv.nadeko.net` (99.7% uptime, Chile)
2. `https://invidious.nerdvpn.de` (99.8% uptime, Ukraine)
3. `https://invidious.f5.si` (96.2% uptime, Japan)
4. `https://inv.perditum.com` (98.9% uptime, Albania)
5. `https://yewtu.be` (100% uptime, Germany)

## Logging System

### Log Format

All logs follow a consistent format with emoji icons:

```
[Component] Icon Message
```

### Icons

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

### Example Log Flow

```
[TranscriptService] ℹ️ Fetching transcript for video: dQw4w9WgXcQ, language: en
[TranscriptService] ℹ️ Attempting method 1/4: Invidious API
[Invidious] 🔍 Fetching transcript for: dQw4w9WgXcQ (lang: en)
[Invidious] 📦 Using cached instances (5 instances)
[Invidious] 🔄 Trying instance 1/5: https://inv.nadeko.net
[Invidious] 📥 Fetching video data: https://inv.nadeko.net/api/v1/videos/dQw4w9WgXcQ
[Invidious] 📊 Video data received: { title: "...", captionsCount: 2 }
[Invidious] 📝 Selected caption track: English (en)
[Invidious] 📄 Caption data received: 12345 bytes
[Parser] 🔍 Parsing VTT format (12345 bytes)
[Parser] ✅ Parsed 245 VTT segments
[Invidious] ✅ Successfully parsed 245 segments
[TranscriptService] ✅ Invidious API succeeded in 1234.56ms with 245 segments
```

## Benefits

### 1. No CORS Issues

Invidious API is accessed through the background service worker, bypassing CORS restrictions.

### 2. Reliability

-   Multiple instances provide redundancy
-   Automatic fallback if one instance fails
-   Live instance health monitoring

### 3. Privacy

Invidious is a privacy-focused frontend, no tracking or ads.

### 4. Comprehensive Data

-   Video metadata (title, author, views, etc.)
-   Multiple caption languages
-   Transcript with timestamps
-   Video statistics

### 5. Better Debugging

Comprehensive logging makes it easy to:

-   Track which method succeeded
-   Identify failing instances
-   Monitor performance
-   Debug issues

## API Response Examples

### Video Data Response

```json
{
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "author": "Rick Astley",
    "authorId": "UCuAXFkgsw1L7xaCfnd5JJOw",
    "lengthSeconds": 213,
    "viewCount": 1234567890,
    "likeCount": 12345678,
    "published": 1234567890,
    "description": "...",
    "keywords": ["rick astley", "never gonna give you up"],
    "genre": "Music",
    "captions": [
        {
            "label": "English",
            "language_code": "en",
            "url": "https://..."
        },
        {
            "label": "Spanish",
            "language_code": "es",
            "url": "https://..."
        }
    ]
}
```

### Transcript Segments

```javascript
[
    {
        start: 0.0,
        duration: 2.5,
        text: "We're no strangers to love",
    },
    {
        start: 2.5,
        duration: 2.8,
        text: "You know the rules and so do I",
    },
    // ... more segments
];
```

## Configuration

### Cache Duration

Instance list is cached for **5 minutes** to reduce API calls:

```javascript
const INSTANCES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
```

### Timeout Settings

-   Instance API fetch: **8 seconds**
-   Video data fetch: **10 seconds**
-   Caption data fetch: **10 seconds**
-   Instance health check: **5 seconds**

## Error Handling

### No Captions Available

```
[Invidious] ⚠️ No captions available for this video
[TranscriptService] ❌ Invidious API failed: No captions available
```

**Solution**: Video doesn't have captions. Try a different video.

### All Instances Failed

```
[Invidious] ❌ Instance https://... failed: HTTP 500
[Invidious] ❌ All instances failed. Last error: ...
[TranscriptService] ⚠️ Invidious API failed, trying next method...
```

**Solution**: Extension automatically falls back to YouTube Direct API.

### Instance API Down

```
[Invidious] ⚠️ Instance API returned HTTP 503, using fallback
[Invidious] 📦 Using fallback instances (5 instances)
```

**Solution**: Uses hardcoded reliable instances.

## Testing

### Test with a Video

1. Open browser console (F12)
2. Navigate to a YouTube video
3. Open the extension sidepanel
4. Click "Analyze Video"
5. Watch the console logs

### Expected Log Output

```
[TranscriptService] ℹ️ Fetching transcript for video: [VIDEO_ID], language: en
[TranscriptService] ℹ️ Attempting method 1/4: Invidious API
[Invidious] 🔍 Fetching fresh instance list from live API...
[Invidious] 📊 Received 7 total instances from API
[Invidious] ✅ Fetched 5 active instances with API enabled
[Invidious] 📋 Top instances: ["https://inv.nadeko.net", ...]
[Invidious] 🔍 Fetching transcript for: [VIDEO_ID] (lang: en)
[Invidious] 🔄 Trying instance 1/5: https://inv.nadeko.net
[Invidious] 📥 Fetching video data: https://inv.nadeko.net/api/v1/videos/[VIDEO_ID]
[Invidious] 📊 Video data received: { title: "...", captionsCount: 2 }
[Parser] 🔍 Parsing VTT format (12345 bytes)
[Parser] ✅ Parsed 245 VTT segments
[TranscriptService] ✅ Invidious API succeeded in 1234.56ms with 245 segments
```

## Documentation

-   **LOGGING_GUIDE.md** - Comprehensive logging documentation
-   **TRANSCRIPT_EXTRACTION_METHODS.md** - Updated with Invidious as primary method
-   **INVIDIOUS_API_IMPLEMENTATION.md** - This file

## Future Improvements

1. **User Preferences**: Allow users to select preferred Invidious instance
2. **Instance Health Dashboard**: Show instance status in options page
3. **Custom Instances**: Allow users to add their own Invidious instances
4. **Performance Metrics**: Track and display API response times
5. **Offline Mode**: Cache transcripts for offline viewing

## Credits

-   **Invidious Project**: https://github.com/iv-org/invidious
-   **Invidious API Documentation**: https://docs.invidious.io/api/
-   **Public Instances**: https://api.invidious.io/

## Support

If you encounter issues:

1. Check browser console for logs
2. Look for error messages with ❌ icon
3. Verify video has captions available
4. Try a different video
5. Report issue with console logs

The comprehensive logging system makes debugging much easier!
