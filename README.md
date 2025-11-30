# YouTube AI Navigator

AI-powered YouTube analysis extension. Transcripts, insights, segments, comments analysis - all private, zero-config.

## Features

- **AI Analysis**: Gemini-powered summaries, insights, FAQ (configurable length, insights count, FAQ count)
- **Smart Transcripts**: Multi-strategy fetching (DOM Automation, Genius, Speech-to-Text) - auto-closes YouTube panel, scrolls to top
- **Segment Classification**: Auto-detect sponsors, intros, content sections with skip/speed actions (auto-applied on analysis)
- **Comment Analysis**: Sentiment analysis, key themes
- **Configurable Output**: Control summary length (short/medium/long), max insights (3-20), max FAQ (3-15), timestamps on/off
- **DeArrow Integration**: Community-sourced clickbait-free titles
- **SponsorBlock**: Skip/speed through segments (configurable per category)
- **Privacy-First**: All processing client-side, no tracking

## Quick Start

```bash
npm install
npm test  # Run headless test suite (Vitest + JSDOM)
```

Load `extension/` folder in Chrome as unpacked extension.

## Configuration

1. Click extension icon → Options
2. Add Gemini API key (free at ai.google.dev)
3. Configure AI analysis settings:
   - Summary Length: short (2-3 paragraphs), medium (4-6), long (8-12)
   - Max Key Insights: 3-20 (default: 8)
   - Max FAQ Items: 3-15 (default: 5)
   - Include Timestamps: Add [MM:SS] references (default: on)
4. Configure transcript methods, segments, UI preferences

## Architecture

### Ultra-Compressed Design

- **Shortcuts**: All common operations use 1-2 letter aliases (`l`=log, `$`=querySelector, `sg`=storage.get)
- **Minimal Tokens**: Stripped comments, compressed keys, dense ES6+ syntax
- **Modular**: Maximum files, minimum tokens per file
- **ESM Integrity**: Import validation tests ensure zero runtime errors
- **Named Exports Only**: No default exports, explicit named exports throughout

### Key Files

- `utils/shortcuts/` - Modular ultra-short utility aliases (dom.js, log.js, core.js, etc.)
- `utils/config.js` - Compressed config with short keys
- `content/transcript/strategy-manager.js` - Multi-strategy transcript extraction
- `api/gemini-client.js` - Gemini API client with rate limiting
- `tests/` - Comprehensive test suite (Vitest + JSDOM)
  - `import-integrity.test.js` - Validates all imports match exports
  - `options.test.js` - Verifies settings saving and auto-save logic
  - `skipping.test.js` - Verifies segment skipping and speed control
  - `comments.test.js` - Verifies comment extraction logic

### Storage Keys (Compressed)

- `cfg` - Main config object
- `obDone` - Onboarding completed
- `apiKey` - Gemini API key

### Default Model

`gemini-2.5-flash-lite-preview-09-2025` - Fastest, most efficient Gemini model

## Transcript Strategies (Priority Order)

1. **DOM Automation** - Automates YouTube UI to extract captions
2. **Genius Lyrics** - Music videos only
3. **Speech-to-Text** - Gemini audio transcription fallback

## Comment Extraction Strategies (Priority Order)

1. **Initial Data** - Extracts comments from ytInitialData before page load
2. **API Interception** - Captures YouTube API responses for real-time comments
3. **DOM Scraping** - Fallback to scraping rendered comment elements with dynamic selectors

## APIs Used

| Service | Purpose                    | Key Required |
| ------- | -------------------------- | ------------ |
| Gemini  | AI analysis, transcription | ✅ Required  |

| Genius | Lyrics for music videos | ⚫ No key |
| SponsorBlock | Segment database | ⚫ No key |
| DeArrow | Clickbait-free titles | ⚫ No key |
| TMDB | Movie/TV metadata | ⚪ Optional |
| NewsData | News context | ⚪ Optional |

## Development

### File Structure

```
extension/
├── api/           # External API clients (compressed)
├── background/    # Service worker, message handlers
├── content/       # Content scripts, UI injection
├── services/      # Core services (transcript, segments, storage)
├── utils/         # Shortcuts, config, helpers
├── options/       # Settings UI
├── sidepanel/     # Analysis panel
└── manifest.json
```

### Shortcuts Usage

```js
import { l, w } from './utils/shortcuts/log.js';
import { $ } from './utils/shortcuts/dom.js';
import { sg, ss } from './utils/shortcuts/storage.js';

l('Log message'); // console.log
const el = qs('.selector'); // document.querySelector
const cfg = await sg('cfg'); // chrome.storage.sync.get
```

## License

MIT - See LICENSE file

## Credits

Built with Gemini AI, SponsorBlock, DeArrow, and other open-source projects.
