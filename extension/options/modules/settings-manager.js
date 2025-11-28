export const DEFAULT_SETTINGS = {
    outputLanguage: "en",
    autoAnalyze: true,
    saveHistory: true,
    apiKey: "",
    model: "",
    customPrompt: "",
    enableSegments: true,
    debugMode: false,
    transcriptMethod: "auto",
    transcriptLanguage: "en",
    // External APIs
    tmdbApiKey: "",
    twitchClientId: "",
    twitchAccessToken: "",
    newsDataApiKey: "",
    googleFactCheckApiKey: "",
    // Segment Settings
    segments: {},
};

export const SEGMENT_CATEGORIES = [
    { id: "Sponsor", label: "Sponsor", color: "#00d26a" },
    { id: "Self Promotion", label: "Self Promotion", color: "#ffff00" },
    { id: "Unpaid Promotion", label: "Unpaid Promotion", color: "#ff8800" },
    { id: "Exclusive Access", label: "Exclusive Access", color: "#008b45" },
    {
        id: "Interaction Reminder (Subscribe)",
        label: "Interaction",
        color: "#a020f0",
    },
    { id: "Highlight", label: "Highlight", color: "#ff0055" },
    {
        id: "Intermission/Intro Animation",
        label: "Intro/Animation",
        color: "#00ffff",
    },
    { id: "Endcards/Credits", label: "Endcards", color: "#0000ff" },
    { id: "Preview/Recap", label: "Preview/Recap", color: "#00bfff" },
    { id: "Hook/Greetings", label: "Hook/Greetings", color: "#4169e1" },
    { id: "Tangents/Jokes", label: "Tangents/Jokes", color: "#9400d3" },
];

export const DEFAULT_SEGMENT_CONFIG = { action: "ignore", speed: 2 };

export class SettingsManager {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.listeners = [];
    }

    async load() {
        try {
            const stored = await chrome.storage.sync.get(null);
            this.settings = { ...DEFAULT_SETTINGS, ...stored };

            // Ensure segments object exists
            if (!this.settings.segments) this.settings.segments = {};
            SEGMENT_CATEGORIES.forEach((cat) => {
                if (!this.settings.segments[cat.id]) {
                    this.settings.segments[cat.id] = {
                        ...DEFAULT_SEGMENT_CONFIG,
                    };
                }
            });

            this.notifyListeners();
            return this.settings;
        } catch (e) {
            console.error("Failed to load settings:", e);
            throw e;
        }
    }

    async save(updates = {}) {
        try {
            this.settings = { ...this.settings, ...updates };
            await chrome.storage.sync.set(this.settings);

            // Update local storage for background script access
            await chrome.storage.local.set({
                geminiApiKey: this.settings.apiKey,
                targetLanguage: this.settings.outputLanguage,
            });

            this.notifyListeners();
        } catch (e) {
            console.error("Failed to save settings:", e);
            throw e;
        }
    }

    async reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        await chrome.storage.sync.clear();
        await this.load();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notifyListeners() {
        this.listeners.forEach((cb) => cb(this.settings));
    }

    get() {
        return this.settings;
    }
}
