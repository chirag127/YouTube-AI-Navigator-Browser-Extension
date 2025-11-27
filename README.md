# YouTube AI Master - Browser Extension

The ultimate free YouTube tool utilizing Google Gemini AI to summarize, segment, and interact with video content. A powerful alternative to paid tools like Eightify.

## Features

### AI Summarization & Insights

-   **Instant Summary**: Generate concise video overviews in seconds
-   **Key Insights Extraction**: Bulleted list of main points without watching
-   **Customizable Length**: Short, Medium, or Detailed summaries
-   **Multilingual Support**: Summarize and translate to 40+ languages
-   **FAQ Generation**: Auto-generate FAQs based on video content

### Smart Navigation & Segment Classification

-   **Timestamped Navigation**: Click timestamps to jump to key parts
-   **AI Segment Detection**: Automatically classify video segments:
    -   Sponsor (Paid promotions)
    -   Interaction Reminder (Like/Subscribe calls)
    -   Self Promotion (Merch/Services)
    -   Unpaid Promotion (Shout-outs)
    -   Highlight (Key moments)
    -   Preview/Recap
    -   Hook/Greetings (Intro/Outro)
    -   Tangents/Jokes (Off-topic content)
-   **Auto-Skip**: Optionally auto-skip sponsors and intros with visual notifications
-   **Visual Markers**: Colored segments on YouTube progress bar

### Knowledge Base

-   **Transcript Extraction**: Clean transcripts from any video with captions
-   **History**: Save and search through analyzed videos
-   **Export/Import**: Backup your knowledge base as JSON

### Interactive AI

-   **Chat with Video**: Ask questions about specific video content
-   **Comment Analysis**: Sentiment analysis of top comments

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `extension` folder
5. The extension icon will appear in your toolbar

### Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and paste it in the extension options

## Usage

1. Navigate to any YouTube video
2. The YouTube AI Master widget appears in the sidebar
3. Analysis starts automatically (or click "Analyze Video" if auto-analysis is disabled)
4. Switch between tabs: Summary, Transcript, Comments, Segments
5. Click any timestamp to jump to that point in the video

### Popup Quick Access

-   Click the extension icon for quick status check
-   Analyze videos directly from the popup
-   Access history and settings

### Settings

-   Configure your Gemini API key
-   Choose summary length preference
-   Select output language
-   Enable/disable auto-analysis on page load
-   Enable/disable auto-skip features (sponsors, intros, previews)
-   Manage history storage

### Auto-Skip Feature

When enabled, the extension automatically skips:

-   **Sponsors**: Paid promotions and advertisements
-   **Intros**: Hook/Greetings and Preview/Recap segments

A subtle notification appears on screen when a segment is skipped, showing what was skipped (e.g., "⏭️ Skipped: Sponsor").

## Technical Details

### Technology Stack

-   **Frontend**: Vanilla JavaScript (ES6 Modules), HTML5, CSS3
-   **AI Backend**: Google Gemini Free API
-   **Storage**: Chrome Storage API
-   **Architecture**: Manifest V3, modular design

### Architecture

The extension uses a modular architecture with clear separation of concerns:

-   **State Management**: Centralized state in `content/core/state.js` manages video analysis state, transcript data, and user settings
-   **Video Detection**: Observer pattern in `content/core/observer.js` detects video changes and triggers analysis
-   **Transcript Extraction**: Multi-method fallback system in `content/transcript/service.js`:
    -   Method 1: YouTube API (direct fetch in content script)
    -   Method 2: Invidious API (delegated to background service worker with dynamic instance discovery)
    -   Method 3: Background proxy (CORS bypass fallback)
    -   Method 4: DOM parse (ytInitialPlayerResponse in content script)
-   **UI Renderers**: Modular rendering system for different content types:
    -   Summary renderer with markdown support
    -   Transcript renderer with clickable timestamps
    -   Segments renderer with visual legend and classification
-   **Service Layer**: Isolated services handle API calls, storage, and business logic
-   **Content Script**: ES6 modules loaded at `document_idle` for optimal performance
-   **Background Worker**: Handles extension lifecycle and cross-tab communication

### File Structure

```
extension/
├── manifest.json          # Extension configuration
├── assets/                # Icons
├── background/            # Service worker
├── content/               # Content script + CSS
│   ├── core/              # Core functionality
│   │   ├── state.js       # Global state & settings
│   │   ├── observer.js    # Video detection
│   │   └── analyzer.js    # Analysis orchestration
│   ├── transcript/        # Transcript extraction
│   │   └── service.js     # Multi-method transcript fetching
│   ├── ui/                # User interface
│   │   ├── components/    # Reusable UI components (loading, error, placeholder)
│   │   └── renderers/     # Tab content renderers
│   │       ├── summary.js    # Summary, insights, FAQ
│   │       ├── transcript.js # Clickable transcript
│   │       └── segments.js   # Classified segments with legend
│   └── utils/             # Utility functions
│       ├── time.js        # Time formatting
│       ├── dom.js         # DOM manipulation
│       └── timestamps.js  # Clickable timestamps
├── lib/                   # Third-party (marked.min.js)
├── options/               # Settings page
├── popup/                 # Extension popup
├── services/              # Core business logic (background)
│   ├── GeminiService.js   # Main AI service (legacy)
│   ├── gemini/            # Modular Gemini components
│   │   ├── api.js         # Low-level API calls (minified)
│   │   └── models.js      # Model management (minified)
│   ├── ChunkingService.js
│   ├── StorageService.js
│   └── SegmentClassificationService.js
├── sidepanel/             # Alternative UI
└── history/               # History page
```

### API Limits (Free Tier)

-   5 requests per minute
-   25 requests per day
-   1M token context window

## Development

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Setup

```bash
npm install
```

### Linting

```bash
npx biome check extension
```

### Testing

```bash
npm test
```

## Privacy

-   All processing happens client-side or in background service worker
-   Your API key is stored locally in Chrome storage
-   No data is sent to third-party servers (except Gemini API)
-   Video transcripts are fetched directly from YouTube or privacy-focused Invidious instances
-   Background service worker handles network-heavy operations for better performance

## Documentation

For detailed technical documentation, see:

-   [Architecture Overview](docs/ARCHITECTURE.md) - System design and module structure
-   [Transcript Service](docs/TRANSCRIPT_SERVICE.md) - Multi-method transcript extraction details
-   [Task List](docs/TASK_LIST.md) - Development progress and completed features
-   [Implementation Plan](docs/MODULAR_IMPLEMENTATION_PLAN.md) - Modular architecture roadmap

## Troubleshooting

### "No captions found"

-   The video doesn't have captions/subtitles enabled
-   Try a different video with closed captions

### "API Key not configured"

-   Open extension options and enter your Gemini API key
-   Test the connection using the "Test API" button

### Widget not appearing

-   Refresh the YouTube page
-   Check if you're on a `/watch` page
-   Verify the extension is enabled

### Rate limiting (429 errors)

-   Wait a few minutes before trying again
-   The free tier has limited requests per minute

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

-   Google Gemini AI for the powerful language model
-   [marked.js](https://marked.js.org/) for Markdown rendering
-   Inspired by Eightify, Glarity, and other YouTube AI tools
