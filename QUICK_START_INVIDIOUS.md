# Quick Start: Using Invidious API

## For Developers

### Basic Usage

```javascript
// Import the service
import { fetchTranscript, fetchMetadata } from "./services/api/invidious.js";

// Fetch transcript
const segments = await fetchTranscript("dQw4w9WgXcQ", "en");
console.log(segments);
// Output: [{ start: 0, duration: 2.5, text: "..." }, ...]

// Fetch metadata
const metadata = await fetchMetadata("dQw4w9WgXcQ");
console.log(metadata.title, metadata.author);
```

### From Content Script

```javascript
// Send message to background
const response = await chrome.runtime.sendMessage({
    action: "FETCH_INVIDIOUS_TRANSCRIPT",
    videoId: "dQw4w9WgXcQ",
    lang: "en",
});

if (response.success) {
    console.log("Transcript:", response.data);
} else {
    console.error("Error:", response.error);
}
```

### From Background Script

```javascript
// Direct API call
const instances = await getInvidiousInstances();
const instance = instances[0];

const response = await fetch(`${instance}/api/v1/videos/dQw4w9WgXcQ`);
const data = await response.json();

console.log("Video data:", data);
```

## API Endpoints

### Get Video Data

```
GET https://[instance]/api/v1/videos/{videoId}?region=US
```

**Response:**

```json
{
  "videoId": "...",
  "title": "...",
  "author": "...",
  "captions": [...]
}
```

### Get Captions

Captions URL is provided in video data response:

```javascript
const captionUrl = videoData.captions[0].url;
const response = await fetch(captionUrl);
const vttText = await response.text();
```

### Search Videos

```
GET https://[instance]/api/v1/search?q=query&type=video
```

## Debugging

### Enable Console Logs

All logs are enabled by default. Filter by component:

```
[Invidious]        - Invidious API logs
[TranscriptService] - Transcript service logs
[Parser]           - Parser logs
```

### Check Instance Health

```javascript
// In browser console
const instances = await getInvidiousInstances();
console.log("Available instances:", instances);

// Test an instance
const response = await fetch("https://inv.nadeko.net/api/v1/stats");
const data = await response.json();
console.log("Instance stats:", data);
```

### Common Issues

**Issue: No captions available**

```javascript
// Check if video has captions
const data = await fetchVideoData(videoId);
console.log("Captions available:", data.captions?.length || 0);
```

**Issue: All instances failed**

```javascript
// Check instance list
const instances = await getInvidiousInstances();
console.log("Instances:", instances);

// Test each instance
for (const instance of instances) {
    try {
        const r = await fetch(`${instance}/api/v1/stats`);
        console.log(`${instance}: OK`);
    } catch (e) {
        console.log(`${instance}: FAILED`);
    }
}
```

## Testing

### Test Transcript Fetching

```javascript
// Test with a known video
const videoId = "dQw4w9WgXcQ"; // Rick Astley - Never Gonna Give You Up

try {
    const segments = await fetchTranscript(videoId, "en");
    console.log(`✅ Success: ${segments.length} segments`);
    console.log("First segment:", segments[0]);
} catch (error) {
    console.error("❌ Failed:", error.message);
}
```

### Test Instance Discovery

```javascript
// Test instance fetching
const instances = await getInvidiousInstances();
console.log(`Found ${instances.length} instances:`);
instances.forEach((inst, i) => {
    console.log(`${i + 1}. ${inst}`);
});
```

### Test Metadata Fetching

```javascript
// Test metadata
const metadata = await fetchMetadata("dQw4w9WgXcQ");
console.log("Title:", metadata.title);
console.log("Author:", metadata.author);
console.log("Views:", metadata.viewCount);
console.log("Captions:", metadata.availableLanguages);
```

## Performance Tips

### 1. Use Caching

Instances are cached for 5 minutes automatically. Don't fetch repeatedly.

### 2. Parallel Requests

Test multiple instances in parallel:

```javascript
const instances = await getInvidiousInstances();
const promises = instances
    .slice(0, 3)
    .map((inst) => fetch(`${inst}/api/v1/videos/${videoId}`));

const results = await Promise.allSettled(promises);
const firstSuccess = results.find((r) => r.status === "fulfilled");
```

### 3. Timeout Handling

Always use timeouts:

```javascript
const response = await fetch(url, {
    signal: AbortSignal.timeout(5000), // 5 second timeout
});
```

## Integration Examples

### React Component

```javascript
import { fetchTranscript } from "./services/api/invidious";

function TranscriptViewer({ videoId }) {
    const [transcript, setTranscript] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const segments = await fetchTranscript(videoId, "en");
                setTranscript(segments);
            } catch (error) {
                console.error("Failed to load transcript:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [videoId]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            {transcript.map((seg, i) => (
                <div key={i}>
                    <span>[{seg.start.toFixed(1)}]</span>
                    <span>{seg.text}</span>
                </div>
            ))}
        </div>
    );
}
```

### Chrome Extension Message Handler

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_TRANSCRIPT") {
        handleGetTranscript(request.videoId, sendResponse);
        return true; // Keep channel open
    }
});

async function handleGetTranscript(videoId, sendResponse) {
    try {
        const segments = await fetchTranscript(videoId, "en");
        sendResponse({ success: true, data: segments });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}
```

## Resources

-   **Invidious API Docs**: https://docs.invidious.io/api/
-   **Instance List**: https://api.invidious.io/instances.json
-   **GitHub**: https://github.com/iv-org/invidious

## Support

For issues or questions:

1. Check console logs
2. Review LOGGING_GUIDE.md
3. Check INVIDIOUS_API_IMPLEMENTATION.md
4. Open an issue with logs
