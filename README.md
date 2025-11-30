# YouTube AI Navigator

AI-powered YouTube analysis extension. Transcripts, insights, segments, comments analysis - all private, zero-config.

## Features

- **AI Analysis**: Gemini-powered summaries, insights, FAQ (configurable length, insights count, FAQ count)
- **Smart Transcripts**: Multi-strategy fetching (DOM Automation, Genius, Speech-to-Text) - auto-closes YouTube panel, scrolls to top
- **Segment Classification**: Auto-detect sponsors, intros, off-topic sections with skip/speed actions (13 SponsorBlock categories: sponsor, selfpromo, interaction, intro, outro, preview, hook, music_offtopic, poi_highlight, filler, exclusive_access, chapter, content)
  - **DISABLED BY DEFAULT**: Segment detection and auto-skip are OFF by default to protect video content
  - **Content Protection**: "Content" segments are NEVER skipped or modified
  - **Conservative Defaults**: Only sponsor/selfpromo default to "skip"; all others default to "ignore"
  - **Explicit Opt-In**: Users must enable segment features in settings
  - **Granular Control**: Configure each segment type individually (ignore/skip/speed) with adjustable speed (1-16x)
  - **Bulk Operations**: Set all segments to skip/speed/ignore with one click
- **Comment Analysis**: Sentiment analysis, key themes
- **Configurable Output**: Control summary length (short/medium/long), max insights (3-20), max FAQ (3-15), timestamps on/off
- **Widget UI**: Responsive sidebar widget with 4 tabs (Summary, Segments, Chat, Comments) - 70vh scrollable content area with "Scrollytelling" animations
- **DeArrow Integration**: Community-sourced clickbait-free titles
- **SponsorBlock**: Skip/speed through segments (configurable per category)
- **Comprehensive Options Page**: Full-featured settings UI for all configuration aspects
- **Privacy-First**: All processing client-side, no tracking

## Quick Start

```bash
npm install
npm test  # Run headless test suite (Vitest + JSDOM)
```

Load `extension/` folder in Chrome as unpacked extension.

## 🎨 Hyper-Configurability (25+ Settings)

The extension implements **maximum user configurability** - every feature, rule, color, and variable is user-customizable through the comprehensive Options page. All settings save to chrome.storage and apply instantly.

### Core Features Configurable

- **Video Analysis**: Enable/disable auto-analysis, auto-summarize, auto-extract key points, auto-detect language, auto-load transcript
- **Chat**: Enable/disable chat features
- **Comments**: Enable/disable analysis, set limit (5-100), max replies depth (0-5), sort by (top/newest/oldest), auto-summarize
- **Segments**: Enable/disable detection, auto-skip, show notifications, show markers, skip tolerance (0.1-2s), min duration (0.5-10s), per-category actions (ignore/skip/speed 1-16x)
- **Transcripts**: Enable/disable, active state, auto-open widget, method (auto/dom/genius/speech), language, include timestamps, auto-translate, show original, highlight keywords, auto-close, auto-close delay (0-5000ms), auto-close on cached, auto-scroll
- **Metadata**: Include/extract title, author, views, duration, description, tags, upload date, chapters
- **Notifications**: Enable/disable, position (top/bottom), duration (1-10s), sound, vibration, browser notifications
- **Cache**: Enable/disable, TTL (1-168h), max size (10-500MB), per-type caching (transcripts/comments/metadata/segments/summaries)
- **Performance**: Rate limits, timeouts, retry attempts, chunk sizes, memory limits
- **UI Appearance**: Theme (dark/light/system), wallpaper mode, compact mode, font family, icon style, primary/accent/background/text/border colors
- **Automation**: Auto-like, auto-thumbs up, auto-next video, auto-loop
- **External APIs**: TMDB, NewsData, Google Fact Check, Twitch (client ID/access token), enable/disable toggles for all 14 APIs
- **Advanced**: Debug mode, enable telemetry, max history (10-1000), export/import settings, reset defaults

### Widget Appearance (2026 Futurist Standard)

- **Hybrid Aesthetic:** "Liquid Glass" translucency meets "Neo-Brutalist" boldness.
- **Liquid Glass:** High-saturation background blurs (`backdrop-filter: blur(40px)`), fluid gradients, and light reflection effects.
- **Neo-Brutalism:** High-contrast borders, raw typography (JetBrains Mono + Outfit), and hard shadows for interactive elements.
- **Scrollytelling:** Data elements (segments, insights, comments) animate in sequentially with staggered delays to guide the user's eye.
- **Micro-interactions:** Every hover, click, and focus state triggers fluid feedback animations (`cubic-bezier` easing).
- **Hyper-Configurability (Options → UI Appearance):**
  - **Colors:** Primary, accent, background, text, border (full color pickers)
  - **Typography:** Font family (Inter/Roboto/Open Sans/Lato/System), icon style
  - **Glass Effects:** Backdrop blur intensity (0-64px), card opacity (0-100%)
  - **Motion:** Animation speed (0.05-0.5s), easing curves (ease-out/elastic/linear), micro-interactions toggle
  - **Structure:** Border width (1-4px), radius scale (0.5-2x), spacing scale (0.75-1.5x)
  - **Effects:** Shadow intensity (0-100%), glow intensity (0-100%), gradient accents toggle
  - **Modes:** Wallpaper mode, compact mode
- **Responsive Layout:**
  - **Dynamic Height:** Automatically adapts to viewport height to prevent clipping.
  - **Resizability:** Drag handles for both width and height.
  - **Positioning:** Dock to Left or Right side.

### Widget Behavior

- **Tab Visibility:** Toggle Summary, Segments, Chat, and Comments tabs.
- **Default State:** Choose whether the widget starts expanded or collapsed.
- **Memory:** Remembers your last used state (collapsed/expanded).

### Segment Filtering

- **Granular Control:** Toggle visibility for specific segment types (Sponsors, Self-promo, Intros, etc.).

### AI Configuration

- **Model Selection:** Choose from available Gemini models
- **API Key:** Secure storage of Gemini API key
- **Temperature:** Creativity level (0-2)
- **Max Tokens:** Response length (100-32768)
- **Custom Prompts:** Editable AI instructions for all analysis types
- **Output Settings:** Summary length, max insights, max FAQs, timestamps

### Scroll & UI Settings

- **Scroll Behavior:** Auto-scroll to comments, scroll back after, show notifications, smooth scrolling, speed, delay
- **UI Preferences:** Theme, font size, animations, tooltips, compact mode

## Configuration

1. Click extension icon → Options
2. Add Gemini API key (free at ai.google.dev)
3. Configure AI analysis settings:
   - Summary Length: short (2-3 paragraphs), medium (4-6), long (8-12)
   - Max Key Insights: 3-20 (default: 8)
   - Max FAQ Items: 3-15 (default: 5)
   - Include Timestamps: Add [MM:SS] references (default: on)
4. **Enable Segment Detection** (DISABLED by default):
   - Navigate to Options → Segments & Actions
   - Toggle "Enable Segment Detection" ON
   - Toggle "Enable Auto-Skip" ON (if desired)
   - Configure segment actions (default settings):
     - **Always Ignored**: Content, Main Content (NEVER skipped)
     - **Skipped by Default**: Sponsor, Self Promotion
     - **Ignored by Default**: Interaction, Intro, Outro, Preview, Off-Topic, Filler, Highlight, Exclusive Access
5. Configure transcript methods, UI preferences

## Architecture

### Ultra-Compressed Design

- **Shortcuts**: All common operations use 1-2 letter aliases (`l`=log, `e`=error, `w`=warn, `ael`=addEventListener, `rel`=removeEventListener, `$`=querySelector, `sg`=storage.get)
- **Minimal Tokens**: Stripped comments, compressed keys, dense ES6+ syntax
- **Modular**: Maximum files, minimum tokens per file (excellent modularity achieved)
- **ESM Integrity**: Import validation tests ensure zero runtime errors
- **Named Exports Only**: No default exports, explicit named exports throughout (audit confirmed integrity)

### Key Files

- `utils/shortcuts/` - Modular ultra-short utility aliases (dom.js, log.js, core.js, etc.)
- `utils/config.js` - Compressed config with short keys
- `content/transcript/strategy-manager.js` - Multi-strategy transcript extraction
- `api/gemini-client.js` - Gemini API client with rate limiting
- `tests/` - Comprehensive test coverage (1:1 mapping with source files, edge cases: network failures, empty states, UI rendering)
  - `import-integrity.test.js` - Validates all imports match exports
  - `options.test.js` - Verifies settings saving and auto-save logic
  - `skipping.test.js` - Verifies segment skipping and speed control
  - `comments.test.js` - Verifies comment extraction logic
  - `segments-config.test.js` - Validates default segment category configuration
  - `settings-manager.test.js` - Validates settings merge and defaults
  - `comprehensive-settings.test.js` - Tests all 12 segment categories, defaults, persistence, export/import
  - `segments-ui.test.js` - Tests UI module bulk operations (setAll) and individual updates
  - `autoskip-integration.test.js` - Integration tests for segment action filtering
  - `content-protection.test.js` - Ensures Content segments are NEVER skipped, validates disabled-by-default behavior
  - `sponsorblock-integration.test.js` - SponsorBlock API integration, label mapping (13 categories)
  - `api-detector.test.js` - API availability detection tests (SponsorBlock, DeArrow, Gemini, TMDB, NewsData, GoogleFactCheck)
  - `segment-label-mapping.test.js` - Label-to-category mapping for all 13 segment types
  - `api-performance.test.js` - API metrics tracking, auto-detection logic
  - `prompts.test.js` - Verifies prompt settings and configuration
  - `comments.test.js` (patterns) - Tests sentiment analysis and spam detection patterns
  - `tab-loader.test.js` - Verifies dynamic tab loading logic
  - `config-defaults.test.js` - Verifies default configuration values
  - `comments.test.js` (api) - Verifies comment prompt generation logic

### Storage Keys (Compressed)

- `cfg` - Main config object
- `obDone` - Onboarding completed
- `apiKey` - Gemini API key

### Default Model

`gemini-2.5-flash-lite-preview-09-2025` - Fastest, most efficient Gemini model

## Transcript Strategies (Priority Order)

1. **DOM Automation** - Automates YouTube UI to extract captions (Auto-scrolls page back to original position)
2. **Genius Lyrics** - Music videos only
3. **Speech-to-Text** - Gemini audio transcription fallback

## Comment Extraction Strategies (Priority Order)

1. **Initial Data** - Extracts comments from ytInitialData before page load
2. **API Interception** - Captures YouTube API responses for real-time comments
3. **DOM Scraping** - Forces scroll to comments section, waits for load, then extracts with configurable retry logic
   - Auto-scrolls to `ytd-comments#comments` section to trigger lazy loading
   - Waits 1200ms + 600ms for comments to render
   - Retry attempts configurable in Options → General → Comments (1-10, default: 5)
   - Extracts up to 20 comments with multiple selector fallbacks
   - Scrolls back to original position after extraction

## Segment Categories & Default Actions

| Category           | Label                | Default Action    | Description                  |
| ------------------ | -------------------- | ----------------- | ---------------------------- |
| `sponsor`          | Sponsor              | Skip              | Paid sponsorships            |
| `selfpromo`        | Self Promotion       | Skip              | Self-promotion (paid/unpaid) |
| `interaction`      | Interaction Reminder | **Ignore**        | Like/subscribe reminders     |
| `intro`            | Intermission/Intro   | **Ignore**        | Intro animations             |
| `outro`            | Endcards/Credits     | **Ignore**        | End credits                  |
| `preview`          | Preview/Recap        | **Ignore**        | Episode recaps               |
| `music_offtopic`   | Off-Topic            | **Ignore**        | Off-topic content            |
| `filler`           | Filler/Tangent       | **Ignore**        | Tangential discussions       |
| `poi_highlight`    | Highlight            | **Ignore**        | Important moments            |
| `exclusive_access` | Exclusive Access     | **Ignore**        | Premium content              |
| `content`          | Content              | **NEVER SKIPPED** | Main video content           |

**Global Defaults**: Segment detection **DISABLED**, Auto-skip **DISABLED**

**Actions**: `ignore` = watch normally, `skip` = instant skip, `speed` = watch at higher playback speed (1-16x)

## APIs Used

| Service           | Purpose                    | Key Required | Settings Path                          |
| ----------------- | -------------------------- | ------------ | -------------------------------------- |
| Gemini            | AI analysis, transcription | ✅ Required  | `ai.apiKey`                            |
| SponsorBlock      | Segment database           | ⚫ No key    | `externalApis.sponsorBlock.enabled`    |
| DeArrow           | Clickbait-free titles      | ⚫ No key    | `externalApis.deArrow.enabled`         |
| Genius Lyrics     | Music lyrics               | ⚫ No key    | `externalApis.geniusLyrics.enabled`    |
| MusicBrainz       | Music metadata             | ⚫ No key    | `externalApis.musicBrainz.enabled`     |
| Wikidata          | Knowledge base             | ⚫ No key    | `externalApis.wikidata.enabled`        |
| Datamuse          | Word relations             | ⚫ No key    | `externalApis.datamuse.enabled`        |
| Open-Meteo        | Weather data               | ⚫ No key    | `externalApis.openMeteo.enabled`       |
| Open Library      | Book metadata              | ⚫ No key    | `externalApis.openLibrary.enabled`     |
| Semantic Scholar  | Academic papers            | ⚫ No key    | `externalApis.semanticScholar.enabled` |
| TMDB              | Movie/TV metadata          | ⚪ Optional  | `externalApis.tmdb.key`                |
| IGDB              | Game metadata              | ⚪ Optional  | `externalApis.igdb.clientId`           |
| NewsData          | News articles              | ⚪ Optional  | `externalApis.newsData.key`            |
| Google Fact Check | Fact-checking              | ⚪ Optional  | `externalApis.googleFactCheck.key`     |

**All APIs**: Configurable enable/disable toggles in Options → External APIs

## Development

### File Structure

```
extension/
├── api/                    # External API clients (14 APIs)
│   ├── gemini.js          # AI analysis, transcription
│   ├── sponsorblock.js    # Segment database (13 categories)
│   ├── dearrow.js         # Clickbait-free titles
│   ├── genius-lyrics.js   # Music lyrics
│   ├── tmdb.js            # Movie/TV metadata
│   ├── igdb.js            # Game metadata
│   ├── musicbrainz.js     # Music metadata
│   ├── newsdata.js        # News articles
│   ├── google-factcheck.js # Fact-checking
│   ├── semanticscholar.js # Academic papers
│   ├── wikidata.js        # Knowledge base
│   ├── openlibrary.js     # Book metadata
│   ├── datamuse.js        # Word relations
│   ├── openmeteo.js       # Weather data
│   └── API_REFERENCE.md   # Complete API documentation
├── background/            # Service worker, message handlers
├── content/               # Content scripts, UI injection
├── services/              # Core services (transcript, segments, storage)
│   └── context-manager.js # Orchestrates all external APIs
├── utils/                 # Shortcuts, config, helpers
├── options/               # Settings UI
│   ├── modules/
│   │   ├── external-apis.js # API settings module
│   │   └── settings-manager.js # Settings persistence
│   └── sections/
│       └── external-apis.html # API configuration UI
├── sidepanel/             # Analysis panel
└── manifest.json
tests/
├── api-settings.test.js   # API configuration tests
├── context-manager.test.js # API integration tests
└── ...                    # 17 test files total
```

## API Auto-Detection

The extension automatically detects API availability:

**No API Keys Required**:

- SponsorBlock: Always available (public API)
- DeArrow: Always available (public API)

**API Key Required**:

- Gemini API: Set in Options → AI Configuration
- TMDB API: Set in Options → External APIs
- NewsData API: Set in Options → External APIs
- GoogleFactCheck API: Set in Options → External APIs

**Availability Checks**:

- Performed on startup and when settings change
- 3-5 second timeouts prevent blocking
- Graceful degradation if APIs unavailable

**Performance Monitoring**:

- Tracks success rate and average duration per API
- Auto-detects underperforming APIs (< 50% success or > 5s avg)
- Metrics reset on extension reload

## Performance Optimization

- **Rate Limiting**: Gemini API limited to 15 requests/minute
- **Retry Logic**: HTTP client retries failed requests (2x with backoff)
- **Timeout Handling**: All API requests have 3-30s timeouts
- **Caching**: Not yet implemented (TODO)

### Resilience Logging

Mandatory failure tracking with concise shortcuts:

- `e('message')` - console.error for failures
- `w('message')` - console.warn for retries/fallbacks
- `l('message')` - console.log for success/info

Every failure, retry, and fallback is logged with context.

### Shortcuts Usage

```js
import { l, w, e } from './utils/shortcuts/log.js';
import { qs, ael, rel } from './utils/shortcuts/dom.js';
import { sg, ss } from './utils/shortcuts/storage.js';
import { lk, ln, lgc } from './utils/shortcuts/segments.js';

l('Log message'); // console.log
e('Error message'); // console.error
w('Warning message'); // console.warn
const el = qs('.selector'); // document.querySelector
ael(btn, 'click', handler); // addEventListener
rel(btn, 'click', handler); // removeEventListener
const cfg = await sg('cfg'); // chrome.storage.sync.get
const key = lk('S'); // 'sponsor' - label code to category key
const name = ln('S'); // 'Sponsor' - label code to full name
const color = lgc('S'); // '#00d26a' - label code to color
```

## License

MIT - See LICENSE file

## Prompt Engineering Architecture

### Hybrid Pattern-Recognition Protocol

- **Token Optimization**: Regex pre-processing for pattern detection (sponsor, selfpromo, interaction, intro, outro, preview, hook, filler)
- **AI Reasoning**: Complex semantic analysis, timing prediction, topic segmentation
- **Pattern Files**: `extension/utils/patterns/` - atomic detection modules per category
- **Hint Generation**: Pre-analyzed patterns injected as context to AI prompts

### Configurable Prompts

All prompts user-editable via Options → Prompt Engineering:

- **Segments**: Role description, timing accuracy (±seconds), pattern hints toggle, duration ranges, min segments
- **Comprehensive**: Role description, keyword bolding, resources section, takeaways, max counts
- **Comments**: Role description, spam filtering, sentiment labeling, engagement thresholds, max themes/questions

### Best Practices (November 2025)

- **Few-Shot**: Examples embedded in prompt structure
- **Chain-of-Thought**: Step-by-step reasoning protocols
- **Persona-Based**: Expert role definitions (15-20+ years experience)
- **SponsorBlock Guidelines**: Official November 2025 category definitions
- **Summary Structure**: Opening → Arguments → Evidence → Conclusions → Takeaways
- **FAQ Structure**: Technical depth → Practical how-to → Comparisons → Troubleshooting → Advanced

## Credits

Built with Gemini AI, SponsorBlock, DeArrow, and other open-source projects.
