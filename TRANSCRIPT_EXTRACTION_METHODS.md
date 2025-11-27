# YouTube Transcript Extraction Methods

## Current Implementation Priority

**This extension now uses the following priority order:**

1. **Invidious API** (Primary) - CORS-free, reliable, comprehensive
2. **YouTube Direct API** - Direct timedtext endpoint (may have CORS issues)
3. **Background Proxy** - Fallback through service worker
4. **DOM Parser** - Last resort, parses ytInitialPlayerResponse

See `LOGGING_GUIDE.md` for debugging information.

---

## Summary of Methods Found in Context Extensions

Based on analysis of similar extensions in the context folder, here are the key methods for extracting YouTube transcripts:

---

## Method 1: Invidious API (Primary - NEW)

### Overview

Invidious is a privacy-focused YouTube frontend with a public API. It provides CORS-free access to YouTube data including transcripts.

### API Endpoint

```
https://[instance]/api/v1/videos/{videoId}
```

### Advantages

-   ✅ No CORS issues (runs through background service worker)
-   ✅ Comprehensive video metadata
-   ✅ Multiple public instances for redundancy
-   ✅ Well-documented API
-   ✅ Returns caption URLs directly

### Implementation

```javascript
// Fetch video data
const response = await fetch(
    `https://invidious.io.lol/api/v1/videos/${videoId}`
);
const data = await response.json();

// Get captions
const captions = data.captions; // Array of available caption tracks
const captionTrack = captions.find((c) => c.language_code === "en");

// Fetch caption data
const captionResponse = await fetch(captionTrack.url);
const captionText = await captionResponse.text();

// Parse VTT or XML format
const segments = parseVTT(captionText);
```

### Response Structure

```javascript
{
  videoId: "dQw4w9WgXcQ",
  title: "Video Title",
  author: "Channel Name",
  lengthSeconds: 213,
  viewCount: 1234567,
  captions: [
    {
      label: "English",
      language_code: "en",
      url: "https://..."
    }
  ]
}
```

### Instance Management

The extension maintains a list of working Invidious instances and automatically falls back if one fails:

```javascript
const instances = [
    "https://invidious.io.lol",
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.private.coffee",
    "https://yt.artemislena.eu",
    "https://yewtu.be",
];
```

---

## Method 2: YouTube Timedtext API (Fallback)

### API Endpoint

```
https://www.youtube.com/api/timedtext
```

### Query Parameters

-   `lang` - Language code (e.g., "en", "ja", "es")
-   `tlang` - Translation language code (optional)
-   `v` - Video ID
-   Additional parameters may include format specifications

### Implementation Example (from Language Reactor)

```javascript
// Intercept XHR requests to /timedtext endpoint
proxy({
    onResponseReady: (xhr) => {
        if (!xhr.responseURL.includes("/timedtext")) {
            return { modify: false };
        }

        const url = new URL(xhr.responseURL);
        const lang = url.searchParams.get("lang");
        const tlang = url.searchParams.get("tlang");

        if (lang) {
            subtitleMap.set(tlang ?? lang, xhr);
        }

        return { modify: false };
    },
});
```

### Response Format

The timedtext API returns JSON with this structure:

```javascript
{
    events: [
        {
            tStartMs: 0, // Start time in milliseconds
            dDurationMs: 2000, // Duration in milliseconds
            segs: [
                {
                    utf8: "Text content", // The actual subtitle text
                },
            ],
        },
        // ... more events
    ];
}
```

---

## Method 2: YouTube Player Response (ytInitialPlayerResponse)

### Location

The `ytInitialPlayerResponse` object is embedded in the page HTML and contains caption track information.

### Access Pattern

```javascript
// From page script
const ytInitialPlayerResponse = window.ytInitialPlayerResponse;

// Navigate to captions
const captions = ytInitialPlayerResponse?.captions;
const playerCaptionsTracklistRenderer =
    captions?.playerCaptionsTracklistRenderer;
const captionTracks = playerCaptionsTracklistRenderer?.captionTracks;
```

### Caption Track Structure

```javascript
{
    captionTracks: [
        {
            baseUrl: "https://www.youtube.com/api/timedtext?...",
            name: { simpleText: "English" },
            vssId: ".en",
            languageCode: "en",
            kind: "asr", // or "manual"
            isTranslatable: true,
        },
        // ... more tracks
    ];
}
```

### Fetching Transcript

```javascript
// Get the baseUrl from a caption track
const baseUrl = captionTracks[0].baseUrl;

// Fetch the transcript
const response = await fetch(baseUrl);
const transcriptData = await response.json();

// Parse events
const transcript = transcriptData.events
    .filter((event) => event.segs)
    .map((event) => ({
        start: event.tStartMs / 1000, // Convert to seconds
        duration: event.dDurationMs / 1000,
        text: event.segs.map((seg) => seg.utf8).join(""),
    }));
```

---

## Method 3: XHR/Fetch Interception

### Approach

Intercept network requests to capture transcript data as YouTube loads it.

### Implementation Pattern

```javascript
// Override XMLHttpRequest
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (method, url, ...args) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...args]);
};

XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener("readystatechange", function () {
        if (this.readyState === 4 && this._url.includes("/timedtext")) {
            // Process transcript data
            const transcriptData = JSON.parse(this.responseText);
            // Store or process as needed
        }
    });

    return originalSend.apply(this, [body]);
};
```

---

## Method 4: YouTube Player API

### Access Player Instance

```javascript
const player = document.getElementById("movie_player");

// Get current time
const currentTime = player.getCurrentTime();

// Get video data
const videoData = player.getVideoData();
const videoId = videoData.video_id;
```

### Use with Transcript Data

Combine player API with transcript data to show synchronized captions.

---

## Key Findings from Context Extensions

### 1. **Language Reactor Userscript**

-   Intercepts `/timedtext` XHR requests
-   Stores responses in a Map by language code
-   Parses JSON response with `events` array
-   Each event has `tStartMs`, `dDurationMs`, and `segs` with `utf8` text

### 2. **YouTube Summary Extension**

-   Uses `ytInitialPlayerResponse` for caption track discovery
-   Fetches transcript via `baseUrl` from caption tracks
-   Formats transcript with timestamps
-   Supports multiple languages

### 3. **Common Patterns**

-   All extensions use the `/api/timedtext` endpoint
-   JSON format is consistent across implementations
-   Timestamps are in milliseconds
-   Text segments can be concatenated from `segs` array

---

## Recommended Implementation Strategy

### Step 1: Get Available Captions

```javascript
function getAvailableCaptions() {
    const ytInitialPlayerResponse =
        window.ytInitialPlayerResponse ||
        JSON.parse(
            document
                .querySelector("script[nonce]")
                ?.textContent?.match(
                    /ytInitialPlayerResponse\s*=\s*({.+?});/
                )?.[1]
        );

    return (
        ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer
            ?.captionTracks || []
    );
}
```

### Step 2: Fetch Transcript

```javascript
async function fetchTranscript(captionTrack) {
    const response = await fetch(captionTrack.baseUrl);
    const data = await response.json();

    return data.events
        .filter((event) => event.segs)
        .map((event) => ({
            start: event.tStartMs / 1000,
            duration: event.dDurationMs / 1000,
            text: event.segs.map((seg) => seg.utf8).join(""),
        }));
}
```

### Step 3: Format for Display

```javascript
function formatTranscript(transcript, includeTimestamps = true) {
    return transcript
        .map((item) => {
            if (includeTimestamps) {
                const timestamp = formatTime(item.start);
                return `[${timestamp}] ${item.text}`;
            }
            return item.text;
        })
        .join("\n");
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, "0")}:${s
            .toString()
            .padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
}
```

---

## Error Handling Considerations

1. **No Captions Available**: Check if `captionTracks` array is empty
2. **Network Errors**: Handle fetch failures gracefully
3. **Parsing Errors**: Validate JSON structure before accessing properties
4. **Language Fallback**: Provide default language if preferred not available
5. **Auto-generated vs Manual**: Check `kind` property ("asr" vs "manual")

---

## Additional Notes

-   **Auto-generated captions** have `kind: "asr"` (Automatic Speech Recognition)
-   **Manual captions** have `kind: "manual"` or undefined
-   Translations are available via `translationLanguages` array
-   Some videos may have no captions at all
-   The `baseUrl` includes all necessary parameters for fetching

---

## Testing Checklist

-   [ ] Videos with manual captions
-   [ ] Videos with auto-generated captions only
-   [ ] Videos with multiple language options
-   [ ] Videos with no captions
-   [ ] Videos with translated captions
-   [ ] Long videos (>1 hour)
-   [ ] Live streams (may not have captions)
