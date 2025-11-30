import { sg, ss } from '../../utils/shortcuts/storage.js';
import { e } from '../../utils/shortcuts/log.js';
import { now as nt, keys as ok, jp, js } from '../../utils/shortcuts/core.js';
import { isa } from '../../utils/shortcuts/array.js';

export const SEGMENT_CATEGORIES = [
  { id: 'sponsor', label: 'Sponsor', color: '#00d400' },
  { id: 'selfpromo', label: 'Self Promotion/Unpaid Promotion', color: '#ffff00' },
  { id: 'interaction', label: 'Interaction Reminder', color: '#cc00ff' },
  { id: 'intro', label: 'Intermission/Intro', color: '#00ffff' },
  { id: 'outro', label: 'Endcards/Credits', color: '#0202ed' },
  { id: 'preview', label: 'Preview/Recap', color: '#008fd6' },
  { id: 'hook', label: 'Hook/Greetings', color: '#4169e1' },
  { id: 'music_offtopic', label: 'Off-Topic', color: '#ff9900' },
  { id: 'poi_highlight', label: 'Highlight', color: '#ff1684' },
  { id: 'filler', label: 'Filler/Tangent', color: '#7300ff' },
  { id: 'exclusive_access', label: 'Exclusive Access', color: '#008a5c' },
  { id: 'chapter', label: 'Chapter', color: '#1e90ff' },
  { id: 'content', label: 'Content (Main Video)', color: '#999999' },
];
export const DEFAULT_SEGMENT_CONFIG = { action: 'ignore', speed: 2 };

export class SettingsManager {
  constructor() {
    this.settings = {};
    this.listeners = [];
  }
  async load() {
    try {
      const r = await sg('config');
      if (r.config && ok(r.config).length > 0) this.settings = this.mergeWithDefaults(r.config);
      else {
        this.settings = this.getDefaults();
      }
      return this.settings;
    } catch (x) {
      e('[SettingsManager] Load error:', x);
      this.settings = this.getDefaults();
      return this.settings;
    }
  }
  async save() {
    try {
      this.settings._meta = this.settings._meta || {};
      this.settings._meta.lastUpdated = nt();
      await ss({ config: this.settings });
      this.notify();
      return true;
    } catch (x) {
      e('[SettingsManager] Save error:', x);
      throw x;
    }
  }
  mergeWithDefaults(loadedSettings) {
    const d = this.getDefaults(),
      m = jp(js(d));
    const dm = (t, s) => {
      for (const k in s) {
        if (s[k] && typeof s[k] === 'object' && !isa(s[k])) {
          t[k] = t[k] || {};
          dm(t[k], s[k]);
        } else t[k] = s[k];
      }
      return t;
    };
    return dm(m, loadedSettings);
  }
  get(p) {
    if (!p) return this.settings;
    return p.split('.').reduce((o, k) => o?.[k], this.settings);
  }
  set(p, v) {
    const k = p.split('.'),
      propKey = k.pop();
    if (!this.settings || typeof this.settings !== 'object') this.settings = this.getDefaults();
    const t = k.reduce((o, key) => {
      if (!o[key] || typeof o[key] !== 'object') o[key] = {};
      return o[key];
    }, this.settings);
    t[propKey] = v;
  }
  async update(p, v) {
    this.set(p, v);
    await this.save();
  }
  async reset() {
    this.settings = this.getDefaults();
    await this.save();
  }
  subscribe(cb) {
    this.listeners.push(cb);
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
        maxSize: 50,
      },
      scroll: {
        autoScrollToComments: true,
        scrollBackAfterComments: true,
        showScrollNotification: true,
        smoothScroll: true,
        scrollSpeed: 'medium',
        autoScrollDelay: 500,
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
        highlightKeywords: true,
        autoScroll: true,
      },
      comments: {
        enabled: true,
        limit: 20,
        includeReplies: true,
        sortBy: 'top',
        analyzeSentiment: true,
        filterSpam: true,
        showAuthorBadges: true,
        highlightPinned: true,
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
        includeChapters: true,
      },
      ui: {
        theme: 'dark',
        widgetPosition: 'secondary',
        autoExpand: false,
        showTimestamps: true,
        compactMode: false,
        fontSize: 'medium',
        animationsEnabled: true,
        showTooltips: true,
        iconStyle: 'default',
        fontFamily: 'Inter',
        accentColor: '#3ea6ff',
        borderRadius: 12,
      },
      widget: {
        height: 500,
        minHeight: 200,
        maxHeight: 1200,
        resizable: true,
        tabs: { summary: true, segments: true, chat: true, comments: true },
        opacity: 95,
        hideOnChannels: [],
      },
      ai: {
        apiKey: '',
        model: 'gemini-2.5-flash-lite-preview-09-2025',
        customPrompt: '',
        outputLanguage: 'en',
        temperature: 0.7,
        maxTokens: 8192,
        streamResponse: true,
        contextWindow: 'auto',
        safetySettings: 'default',
        summaryLength: 'medium',
        maxInsights: 8,
        maxFAQ: 5,
        includeTimestamps: true,
        baseUrl: '',
        topP: 0.95,
        topK: 40,
      },
      automation: {
        autoAnalyze: true,
        autoSummarize: true,
        autoExtractKeyPoints: true,
        autoDetectLanguage: true,
        autoLoadTranscript: true,
      },
      segments: {
        enabled: false,
        categories: {
          sponsor: { action: 'skip', speed: 2 },
          selfpromo: { action: 'skip', speed: 2 },
          interaction: { action: 'ignore', speed: 2 },
          intro: { action: 'ignore', speed: 2 },
          outro: { action: 'ignore', speed: 2 },
          preview: { action: 'ignore', speed: 2 },
          hook: { action: 'ignore', speed: 2 },
          music_offtopic: { action: 'ignore', speed: 2 },
          poi_highlight: { action: 'ignore', speed: 2 },
          filler: { action: 'ignore', speed: 2 },
          exclusive_access: { action: 'ignore', speed: 2 },
          chapter: { action: 'ignore', speed: 1 },
          content: { action: 'ignore', speed: 1 },
        },
        autoSkip: false,
        showNotifications: true,
        skipTolerance: 0.5,
        minSegmentDuration: 1,
        showMarkers: true,
        colorCodeMarkers: true,
        userOverrides: {},
      },
      externalApis: {
        enabled: true,
        tmdb: { key: '', enabled: true },
        newsData: { key: '', enabled: true },
        googleFactCheck: { key: '', enabled: true },
        igdb: { clientId: '', accessToken: '', enabled: true },
        musicBrainz: { enabled: true },
        openLibrary: { enabled: true },
        semanticScholar: { enabled: true },
        wikidata: { enabled: true },
        datamuse: { enabled: true },
        openMeteo: { enabled: true },
        geniusLyrics: { enabled: true },
        deArrow: { enabled: true, usePrivateAPI: true, timeout: 5000 },
        sponsorBlock: { enabled: true, timeout: 5000 },
      },
      advanced: {
        debugMode: false,
        saveHistory: true,
        maxHistoryItems: 100,
        enableTelemetry: false,
        experimentalFeatures: false,
        verboseLogging: false,
        exportFormat: 'json',
      },
      performance: {
        maxConcurrentRequests: 3,
        rateLimitDelay: 1000,
        retryAttempts: 3,
        retryDelay: 2000,
        enableCompression: true,
        lazyLoad: true,
        prefetchData: true,
      },
      notifications: {
        enabled: true,
        position: 'top-right',
        duration: 3000,
        sound: false,
        showOnSave: true,
        showOnError: true,
        showProgress: true,
      },
      _meta: { version: '1.0.0', lastUpdated: nt(), onboardingCompleted: false },
    };
  }
  export() {
    return js(this.settings, null, 2);
  }
  async import(j) {
    try {
      const i = jp(j);
      this.settings = i;
      await this.save();
      return true;
    } catch (x) {
      e('[Settings] Import failed:', x);
      return false;
    }
  }
}
