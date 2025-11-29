// Segment Categories Configuration
export const SEGMENT_CATEGORIES = [
    { id: 'sponsor', label: 'Sponsor', color: '#00d400' },
    { id: 'selfpromo', label: 'Self Promotion', color: '#ffff00' },
    { id: 'interaction', label: 'Interaction Reminder', color: '#cc00ff' },
    { id: 'intro', label: 'Intermission/Intro', color: '#00ffff' },
    { id: 'outro', label: 'Endcards/Credits', color: '#0202ed' },
    { id: 'preview', label: 'Preview/Recap', color: '#008fd6' },
    { id: 'music_offtopic', label: 'Off-Topic', color: '#ff9900' },
    { id: 'poi_highlight', label: 'Highlight', color: '#ff1684' },
    { id: 'filler', label: 'Filler/Tangent', color: '#7300ff' },
    { id: 'exclusive_access', label: 'Exclusive Access', color: '#008a5c' }
];

export const DEFAULT_SEGMENT_CONFIG = {
    action: 'skip',
    speed: 2
};

export class SettingsManager {
    constructor() {
        this.settings = {};
        this.listeners = [];
    }

    async load() {
        try {
            const result = await chrome.storage.sync.get('config');
            console.log('[SettingsManager] Loaded from storage:', result);

            if (result.config && Object.keys(result.config).length > 0) {
                // Merge with defaults to ensure all keys exist
                this.settings = this.mergeWithDefaults(result.config);
            } else {
                console.log('[SettingsManager] No config found, using defaults');
                this.settings = this.getDefaults();
            }

            console.log('[SettingsManager] Final settings:', this.settings);
            return this.settings;
        } catch (error) {
            console.error('[SettingsManager] Load error:', error);
            this.settings = this.getDefaults();
            return this.settings;
        }
    }

    async save() {
        try {
            this.settings._meta = this.settings._meta || {};
            this.settings._meta.lastUpdated = Date.now();

            console.log('[SettingsManager] Saving to storage:', this.settings);
            await chrome.storage.sync.set({ config: this.settings });

            // Verify save
            const verify = await chrome.storage.sync.get('config');
            console.log('[SettingsManager] Verified save:', verify);

            this.notify();
            return true;
        } catch (error) {
            console.error('[SettingsManager] Save error:', error);
            throw error;
        }
    }

    mergeWithDefaults(loaded) {
        const defaults = this.getDefaults();
        const merged = JSON.parse(JSON.stringify(defaults));

        // Deep merge loaded settings into defaults
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };

        return deepMerge(merged, loaded);
    }

    get(path) {
        if (!path) return this.settings;
        return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
    }

    set(path, value) {
        const keys = path.split('.');
        const last = keys.pop();

        // Ensure settings object exists
        if (!this.settings || typeof this.settings !== 'object') {
            this.settings = this.getDefaults();
        }

        const target = keys.reduce((obj, key) => {
            if (!obj[key] || typeof obj[key] !== 'object') {
                obj[key] = {};
            }
            return obj[key];
        }, this.settings);

        target[last] = value;
        console.log(`[Settings] Set ${path} =`, value);
    }

    async update(path, value) {
        console.log(`[Settings] Update ${path} =`, value);
        this.set(path, value);
        await this.save();
        console.log('[Settings] Saved to storage');
    }

    async reset() {
        this.settings = this.getDefaults();
        await this.save();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.settings));
    }

    getDefaults() {
        return {
            cache: {
                enabled: true,
                ttl: 86400000,
                transcripts: true,
                comments: true,
                metadata: true,
                segments: true,
                summaries: true,
                maxSize: 50 // MB
            },
            scroll: {
                autoScrollToComments: false,
                scrollBackAfterComments: true,
                showScrollNotification: true,
                smoothScroll: true,
                scrollSpeed: 'medium',
                autoScrollDelay: 500
            },
            transcript: {
                autoClose: true,
                autoCloseDelay: 1000,
                autoCloseOnCached: false,
                language: 'en',
                method: 'auto',
                includeTimestamps: true,
                autoTranslate: true,
                showOriginal: false,
                highlightKeywords: true
            },
            comments: {
                enabled: true,
                limit: 20,
                includeReplies: true,
                sortBy: 'top',
                analyzeSentiment: true,
                filterSpam: true,
                showAuthorBadges: true,
                highlightPinned: true
            },
            metadata: {
                includeTitle: true,
                includeAuthor: true,
                includeViews: true,
                includeDuration: true,
                includeDescription: true,
                includeTags: true,
                includeUploadDate: true,
                includeCategory: true,
                includeLikes: true,
                includeChapters: true
            },
            ui: {
                theme: 'dark',
                widgetPosition: 'secondary',
                autoExpand: false,
                showTimestamps: true,
                compactMode: false,
                fontSize: 'medium',
                animationsEnabled: true,
                showTooltips: true
            },
            ai: {
                apiKey: '',
                model: 'gemini-2.0-flash-exp',
                customPrompt: '',
                outputLanguage: 'en',
                temperature: 0.7,
                maxTokens: 8192,
                streamResponse: true,
                contextWindow: 'auto',
                safetySettings: 'default'
            },
            automation: {
                autoAnalyze: true,
                autoSummarize: true,
                autoExtractKeyPoints: true,
                autoDetectLanguage: true,
                autoLoadTranscript: true
            },
            segments: {
                enabled: true,
                categories: {},
                autoSkip: true,
                showNotifications: true
            },
            externalApis: {
                tmdb: '',
                newsData: '',
                googleFactCheck: '',
                twitchClientId: '',
                twitchAccessToken: '',
                enabled: true
            },
            advanced: {
                debugMode: false,
                saveHistory: true,
                maxHistoryItems: 100,
                enableTelemetry: false,
                experimentalFeatures: false,
                verboseLogging: false
            },
            performance: {
                maxConcurrentRequests: 3,
                rateLimitDelay: 1000,
                retryAttempts: 3,
                retryDelay: 2000,
                enableCompression: true,
                lazyLoad: true,
                prefetchData: true
            },
            notifications: {
                enabled: true,
                position: 'top-right',
                duration: 3000,
                sound: false,
                showOnSave: true,
                showOnError: true,
                showProgress: true
            },
            _meta: {
                version: '1.0.0',
                lastUpdated: Date.now(),
                onboardingCompleted: false
            }
        };
    }

    export() {
        return JSON.stringify(this.settings, null, 2);
    }

    async import(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.settings = imported;
            await this.save();
            return true;
        } catch (e) {
            console.error('[Settings] Import failed:', e);
            return false;
        }
    }
}
