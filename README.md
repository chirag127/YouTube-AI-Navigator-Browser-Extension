# YouTube AI Master

**The Definitive AI Companion for YouTube.**

_Turn passive viewing into active intelligence. YouTube AI Master orchestrates a symphony of advanced AI and real-time data sources to deliver instant, deep, and context-aware insights for any video._

---

## 💎 The Philosophy of Excellence

YouTube AI Master is not just another wrapper around an LLM. It is a **Context Engine**.

We believe that an AI is only as good as the data it consumes. A generic prompt yields a generic response. To achieve true insight, an AI must understand the world surrounding the video—the cultural references, the scientific facts, the gaming lore, and the breaking news.

This extension implements a **Multi-Threaded Context Architecture** that autonomously queries up to **10+ specialized, free-to-use APIs** in parallel. It weaves this external knowledge into a unified context window, empowering Google's Gemini 1.5 Pro/Flash to deliver analysis that rivals human expert commentary.

**Zero Cost. Zero Friction. Zero Compromise.**
Every integrated API is free. No credit cards required. No mandatory sign-ups. Complete privacy.

### 🎯 **Precision Navigation**

-   **Smart Segmentation:** The AI automatically partitions the video into logical chapters.
-   **SponsorBlock Integration:** Native support for community-verified segments. Automatically skip sponsors, intros, and interaction reminders.
-   **Visual Timeline:** See the video's structure at a glance with color-coded markers on the player.

### 🛡️ **Privacy & Performance**

-   **Local-First:** Your API keys are stored in Chrome's secure sync storage. They never leave your browser except to hit the official endpoints.
-   **Concurrency:** Uses `Promise.allSettled` to fetch data from 10+ sources simultaneously, ensuring zero latency impact.
-   **Fault Tolerance:** If an API fails or a key is missing, the system gracefully degrades, skipping only that specific data point without interrupting the user experience.

---

## 🛠️ Configuration & Setup

### 1. Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/chirag127/youtube-ai-master.git
    ```
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (top right).
4.  Click **Load unpacked** and select the `extension` folder.

### 2. The "Context Engine" Setup (Optional but Recommended)

Go to the **Extension Settings > External APIs** tab. All keys are for **Free Tier** plans.

| Category    | Service           | Requirement  | Cost |
| :---------- | :---------------- | :----------- | :--- |
| **AI Core** | **Google Gemini** | **Required** | Free |
| Movies/TV   | TMDB              | Optional     | Free |
| Gaming      | IGDB (Twitch)     | Optional     | Free |
| News        | NewsData.io       | Optional     | Free |
| Fact Check  | Google Cloud      | Optional     | Free |
| Science     | Semantic Scholar  | **No Key**   | Free |
| Books       | Open Library      | **No Key**   | Free |
| Knowledge   | Wikidata          | **No Key**   | Free |
| Language    | Datamuse          | **No Key**   | Free |
| Weather     | OpenMeteo         | **No Key**   | Free |

_Note: The extension works perfectly with just the Gemini Key. The other APIs simply enhance the depth of the analysis._

---

## 🏗️ Architecture of Excellence

The codebase is engineered for production-grade reliability, performance, and maintainability.

### **Unbreakable UI Architecture**

The user interface is built to survive the hostile environment of the modern web:

-   **Self-Healing DOM Injection:** A dedicated `MutationObserver` monitors the YouTube sidebar 60 times per second. If the AI Widget is displaced, covered, or removed by YouTube's dynamic navigation, it is instantly re-injected at the top.
-   **Z-Index Supremacy:** Engineered with a calculated stacking context (`z-index: 2202`) to ensure it floats above all YouTube native elements, including playlists, transcripts, and ads.
-   **SPA-Aware Navigation:** The extension listens to YouTube's internal `yt-navigate-finish` events to handle soft navigations seamlessly, ensuring the widget is always present without page reloads.

### **Modular Design Pattern**

We strictly adhere to the **Single Responsibility Principle** with maximum modularity:

-   **`extension/api/core/`**: Shared infrastructure (HTTP client, rate limiter, error handler)
-   **`extension/api/`**: Isolated, fault-tolerant wrappers for each external service
-   **`extension/services/context-manager.js`**: Orchestrates parallel API calls with graceful degradation
-   **`extension/background/handlers/`**: Request handlers with comprehensive error handling

### **Production-Grade Reliability**

**Exponential Backoff Retry:**

-   Automatically retries transient failures (rate limits, server errors, timeouts)
-   Configurable retry attempts with exponential delays (1s → 2s → 4s)
-   Fails fast on non-retryable errors (auth, bad request)

**Rate Limiting:**

-   Token bucket algorithm prevents exceeding API limits (15 RPM for Gemini free tier)
-   Request queuing when limit reached
-   Real-time statistics tracking

**Timeout Protection:**

-   All API calls have configurable timeouts (default 30s)
-   Prevents hanging requests from blocking the extension
-   Uses AbortController for clean cancellation

**Error Classification:**

-   Distinguishes between retryable and fatal errors
-   Provides user-friendly, actionable error messages
-   Structured logging for debugging

### **Performance Optimizations**

-   **Parallel Execution:** Context Manager fetches 10+ APIs simultaneously using `Promise.allSettled`
-   **Request Caching:** Previously analyzed videos return instantly
-   **Service Worker Keep-Alive:** Prevents termination during long operations
-   **Model Fallback:** Automatically tries alternative models if primary fails

### **Security & Validation**

-   **Input Sanitization:** All external data validated and sanitized
-   **Sender Verification:** Only accepts messages from extension pages
-   **API Key Protection:** Stored securely in Chrome sync storage, never logged

### **Future-Proofing**

-   **Manifest V3 Compliant:** Built on modern Service Worker architecture
-   **Model Agnostic:** Supports any Gemini model (Flash, Pro, Ultra)
-   **Extensible:** Easy to add new APIs or features

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 📜 License

MIT License. Built with ❤️ for the Open Source community.
