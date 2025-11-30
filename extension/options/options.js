import { SettingsManager } from './modules/settings-manager.js';
import { AutoSave } from './modules/auto-save.js';
import { UIManager } from './modules/ui-manager.js';
import { TabLoader } from './modules/tab-loader.js';
import { GeneralSettings } from './modules/general.js';
import { AIConfig } from './modules/ai-config.js';
import { SegmentsConfig } from './modules/segments.js';
import { ExternalAPIs } from './modules/external-apis.js';
import { AdvancedSettings } from './modules/advanced.js';
import { PerformanceSettings } from './modules/performance.js';
import { NotificationManager } from './modules/notification-manager.js';
import { NotificationsSettings } from './modules/notifications-settings.js';
import { CacheSettings } from './modules/cache-settings.js';
import { TranscriptSettings } from './modules/transcript-settings.js';
import { CommentsSettings } from './modules/comments-settings.js';
import { MetadataSettings } from './modules/metadata-settings.js';
import { ScrollSettings } from './modules/scroll-settings.js';
import { on, id as i } from '../utils/shortcuts/dom.js';
import { e } from '../utils/shortcuts/log.js';
import { vl as vs } from '../utils/shortcuts/core.js';
import { url } from '../utils/shortcuts/runtime.js';
import { tbc as tc } from '../utils/shortcuts/tabs.js';
on(document, 'DOMContentLoaded', async () => {
  const settingsManager = new SettingsManager();
  const notificationManager = new NotificationManager();
  const autoSave = new AutoSave(settingsManager, 300, notificationManager);
  const uiManager = new UIManager();
  const tabLoader = new TabLoader();
  await settingsManager.load();
  notificationManager.info('Settings loaded successfully');
  await tabLoader.loadAll();
  const settings = settingsManager.get();
  const welcomeBanner = i('#welcome-banner');
  const startSetupBtn = i('#start-setup-btn');
  const dismissBannerBtn = i('#dismiss-banner-btn');
  if (!settings._meta?.onboardingCompleted && !settings.ai?.apiKey) {
    if (welcomeBanner) welcomeBanner.style.display = 'block';
  }
  startSetupBtn &&
    on(startSetupBtn, 'click', () => {
      tc({ url: url('onboarding/onboarding.html') });
    });
  dismissBannerBtn &&
    on(dismissBannerBtn, 'click', () => {
      if (welcomeBanner) welcomeBanner.style.display = 'none';
    });
  uiManager.setupTabs();
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
    scroll: new ScrollSettings(settingsManager, autoSave),
  };
  vs(modules).forEach(m => {
    try {
      m.init();
    } catch (x) {
      e(`[Options] Failed to init ${m.constructor.name}:`, x);
    }
  });
});
