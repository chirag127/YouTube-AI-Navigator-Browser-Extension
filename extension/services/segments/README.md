# Segment Classification System

## Overview

The segment classification system uses **Gemini AI** to analyze video transcripts and identify specific segment types (sponsors, highlights, intros, etc.).

## Segment Categories

### 1. Sponsor

-   **Definition**: Paid promotions, ad reads, product placements
    -ps\*\*: Start + End (2 timestamps)
-   **Rule**: If ENTIRE video is about the product, use "Full Video Label" instead

### 2. Interaction Reminder

-   **Definition**: "Like, Subscribe, Hit the Bell" requests
-   **Timestamps**: Start + End (2 timestamps)

### 3. Self Promotion

-   **Definition**: Creator's merch, courses, Patreon
-   **Timestamps**: Start + End (2 timestamps)

### 4. Unpaid Promotion

-   **Definition**: Shout-outs to friends/charities
-   **Timestamps**: Start + End (2 timestamps)

### 5. Highlight ⭐

-   **Definition**: Core value moment of video (ONLY ONE PER VIDEO)
-   **Timestamps**: Start ONLY (1 timestamp)
-   **Critical Rule**: There can be ONLY ONE Highlight segment per video

### 6. Preview/Recap

-   **Definition**: "Coming up" teasers or "Previously on" recaps
-   **Timestamps**: Start + End (2 timestamps)

### 7. Hook/Greetings

-   **Definition**: Generic intros/outros
-   **Timestamps**: Start + End (2 timestamps)

### 8. Tangents/Jokes

-   **Definition**: Off-topic or entertainment filler
-   **Timestamps**: Start + End (2 timestamps)

## Timestamp Rules

### Critical Distinction

**Highlight (1 timestamp):**

```json
{
    "label": "Highlight",
    "start": 120.5,
    "description": "Main point of the video"
}
```

**All Others (2 timestamps):**

```json
{
    "label": "Sponsor",
    "start": 10.5,
    "end": 45.2,
    "description": "NordVPN sponsorship"
}
```

### UI Behavior

-   **Both timestamps are clickable** in the UI
-   Clicking **start timestamp** jumps to segment beginning
-   Clicking **end timestamp** jumps to segment end
-   Allows users to skip to segment boundaries

## Prompt Engineering

The segment classification prompt in `services/gemini/prompts.js` enforces:

1. **ONE HIGHLIGHT ONLY** - Strict rule, no exceptions
2. **Timestamp format** - Highlight has 1, others have 2
3. **Clickability** - Both timestamps must be clickable
4. **No generic segments** - No "Content" or vague labels
5. **Clear identification** - Only include segments you can clearly identify

## Implementation

### Classifier Service

```javascript
// services/segments/classifier.js
export async function classifyTranscript(transcript, geminiService) {
    const formatted = transcript
        .map((s) => `[${s.start.toFixed(1)}] ${s.text}`)
        .join("\n");

    const segments = await geminiService.extractSegments(formatted);
    return segments;
}
```

### Gemini API Call

```javascript
// services/gemini/api.js
async extractSegments(formattedTranscript) {
  const prompt = prompts.segments(formattedTranscript)
  const response = await this.generateContent(prompt)
  return JSON.parse(response)
}
```

## UI Rendering

### Segment Renderer

```javascript
// content/ui/renderers/segments.js
export function renderSegments(container, segments) {
    segments.forEach((segment) => {
        const isHighlight = segment.label === "Highlight";

        // Highlight: 1 timestamp, Others: 2 timestamps
        const timeHtml = isHighlight
            ? `<span class="yt-ai-timestamp" data-time="${segment.start}">
           ${formatTime(segment.start)}
         </span>`
            : `<span class="yt-ai-timestamp" data-time="${segment.start}">
           ${formatTime(segment.start)}
         </span> -
         <span class="yt-ai-timestamp" data-time="${segment.end}">
           ${formatTime(segment.end)}
         </span>`;

        // Make all timestamps clickable
        container.querySelectorAll(".yt-ai-timestamp").forEach((el) => {
            el.style.cursor = "pointer";
            el.style.textDecoration = "underline";
            el.addEventListener("click", (e) => {
                e.stopPropagation();
                seekVideo(parseFloat(el.dataset.time));
            });
        });
    });
}
```

## Color Coding

```javascript
const colors = {
    Sponsor: "#00d26a", // Green
    "Interaction Reminder (Subscribe)": "#a020f0", // Purple
    "Self Promotion": "#ffff00", // Yellow
    "Unpaid Promotion": "#ff8800", // Orange
    Highlight: "#ff0055", // Pink
    "Intermission/Intro Animation": "#00ffff", // Cyan
    "Endcards/Credits": "#0000ff", // Blue
    "Preview/Recap": "#00bfff", // Light Blue
    "Hook/Greetings": "#4169e1", // Royal Blue
    "Tangents/Jokes": "#9400d3", // Dark Violet
    "Exclusive Access": "#008b45", // Dark Green
};
```

## Auto-Skip Feature

Users can enable auto-skip for specific segment types:

```javascript
// content/segments/autoskip.js
export function setupAutoSkip(segments) {
  const settings = await getSettings()

  if (settings.autoSkipSponsors) {
    skipSegmentType(segments, 'Sponsor')
  }

  if (settings.autoSkipIntros) {
    skipSegmentType(segments, 'Hook/Greetings')
  }
}
```

## Timeline Markers

Visual markers on the video progress bar:

```javascript
// content/segments/timeline.js
export function renderTimeline(segments, videoDuration) {
    segments.forEach((segment) => {
        const startPercent = (segment.start / videoDuration) * 100;
        const endPercent = (segment.end / videoDuration) * 100;

        // Create marker on timeline
        createMarker(startPercent, endPercent, segment.label);
    });
}
```

## Testing

### Test Segment Classification

```javascript
const transcript = [
    { start: 0, duration: 5, text: "Hey everyone, welcome back" },
    { start: 5, duration: 30, text: "This video is sponsored by..." },
    { start: 120, duration: 10, text: "The key insight is..." },
    // ...
];

const segments = await classifyTranscript(transcript, geminiService);

// Verify ONE highlight
const highlights = segments.filter((s) => s.label === "Highlight");
console.assert(highlights.length === 1, "Should have exactly 1 highlight");

// Verify timestamp format
highlights.forEach((h) => {
    console.assert(!h.end, "Highlight should not have end timestamp");
});

segments
    .filter((s) => s.label !== "Highlight")
    .forEach((s) => {
        console.assert(s.end, "Non-highlight should have end timestamp");
    });
```

## Best Practices

1. **Always enforce ONE HIGHLIGHT** - Critical for user experience
2. **Make timestamps clickable** - Both start and end
3. **Use clear descriptions** - Help users understand what's in each segment
4. **Respect user preferences** - Auto-skip settings
5. **Visual feedback** - Color coding and timeline markers

## Troubleshooting

### Multiple Highlights Detected

-   **Cause**: Prompt not enforced or AI hallucination
-   **Fix**: Update prompt to be more explicit, add validation

### Missing End Timestamps

-   **Cause**: Transcript doesn't have clear segment boundaries
-   **Fix**: Improve transcript formatting, add more context

### Incorrect Classifications

-   **Cause**: Ambiguous content or poor transcript quality
-   **Fix**: Improve prompt with examples, use better model

## Related Files

-   `services/gemini/prompts.js` - Segment classification prompt
-   `services/segments/classifier.js` - Classification logic
-   `content/ui/renderers/segments.js` - UI rendering
-   `content/segments/autoskip.js` - Auto-skip functionality
-   `content/segments/timeline.js` - Timeline markers
-   `content/segments/markers.js` - Video player markers
