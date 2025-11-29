import { SettingsManager } from "./modules/settings-manager.js";
import { AutoSave } from "./modules/auto-save.js";
import { UIManager } from "./modules/ui-manager.js";
import { TabLoader } from "./modules/tab-loader.js";
import { GeneralSettings } from "./modules/general.js";
import { AIConfig } from "./modules/ai-config.js";
import { SegmentsConfig } from "./modules/segments.js";
import { ExternalAPIs } from "./modules/external-apis.js";
import { AdvancedSettings } from "./modules/advanced.js";
import { PerformanceSettings } from "./modules/performance.js";
import { NotificationManager } from "./modules/notification-manager.js";
import { NotificationsSettings } from "./modules/notifications-settings.js";
import { CacheSettings } from "./modules/cache-settings.js";
import { TranscriptSettings } from "./modules/transcript-settings.js";
import { CommentsSettings } from "./modules/comments-settings.js";
import { MetadataSettings } from "./modules/metadata-settings.js";
import { ScrollSettings } from "./modules/scroll-settings.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log('[Options] Initializing...');

    const settingsManager = new SettingsManager();
    const notificationManager = new NotificationManager();
    const autoSave = new AutoSave(settingsManager, 300, notificationManager); // 300ms debounce
    const uiManager = new UIManager();
    const tabLoader = new TabLoader();

    // Load settings FIRST
    console.log('[Options] Loading settings...');
    await settingsManager.load();
    console.log('[Options] Settings loaded:', settingsManager.get());

    notificationManager.info('Settings loaded successfully');

    // Load dynamic tabs
    console.log('[Options] Loading dynamic tabs...');
    await tabLoader.loadAll();

    // Check onboarding
    const settings = settingsManager.get();
    const welcomeBanner = document.getElementById('welcome-banner');
    const startSetupBtn = document.getElementById('start-setup-btn');
    const dismissBannerBtn = document.getElementById('dismiss-banner-btn');

    if (!settings._meta?.onboardingCompleted && !settings.ai?.apiKey) {
        welcomeBanner.style.display = 'block';
    }

    startSetupBtn?.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
    });

    dismissBannerBtn?.addEventListener('click', () => {
        welcomeBanner.style.display = 'none';
    });

    // Setup tabs
    uiManager.setupTabs();

    // Initialize modules with auto-save
    console.log('[Options] Initializing modules...');
    const modules = {
        general: new GeneralSettings(settingsManager, autoSave),
        aiConfig: new AIConfig(settingsManager, autoSave),
        segments: new SegmentsConfig(settingsManager, autoSave),
        externalApis: new ExternalAPIs(settingsManager, autoSave),
        advanced: new AdvancedSettings(settingsManager, autoSave),
        performance: new PerformanceSettings(settingsManager, autoSave),
        notifications: new NotificationsSettings(settingsManager, autoSave),
        cache: new CacheSettings(settingsManager, autoSave),
        transcript: new TranscriptSettings(settingsManager, autoSave),
        comments: new CommentsSettings(settingsManager, autoSave),
        metadata: new MetadataSettings(settingsManager, autoSave),
        scroll: new ScrollSettings(settingsManager, autoSave)
    };

    // Init all modules
    Object.values(modules).forEach((m) => {
        try {
            m.init();
            console.log(`[Options] Initialized ${m.constructor.name}`);
        } catch (e) {
            console.error(`[Options] Failed to init ${m.constructor.name}:`, e);
        }
    });

    console.log('[Options] ✓ Fully initialized with auto-save');
});
