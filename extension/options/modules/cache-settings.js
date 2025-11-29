export class CacheSettings {
    constructor(settingsManager, autoSave) {
        this.settings = settingsManager;
        this.autoSave = autoSave;
    }

    init() {
        this.loadSettings();
        this.attachListeners();
        this.setupButtons();
    }

    loadSettings() {
        const config = this.settings.get();

        this.setChecked('cacheEnabled', config.cache?.enabled ?? true);
        this.setValue('cacheTTL', (config.cache?.ttl || 86400000) / 3600000);
        this.setValue('cacheMaxSize', config.cache?.maxSize || 50);
        this.setChecked('cacheTranscripts', config.cache?.transcripts ?? true);
        this.setChecked('cacheComments', config.cache?.comments ?? true);
        this.setChecked('cacheMetadata', config.cache?.metadata ?? true);
        this.setChecked('cacheSegments', config.cache?.segments ?? true);
        this.setChecked('cacheSummaries', config.cache?.summaries ?? true);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            cacheEnabled: { path: 'cache.enabled' },
            cacheTTL: { path: 'cache.ttl', transform: (v) => parseInt(v) * 3600000 },
            cacheMaxSize: { path: 'cache.maxSize', transform: (v) => parseInt(v) },
            cacheTranscripts: { path: 'cache.transcripts' },
            cacheComments: { path: 'cache.comments' },
            cacheMetadata: { path: 'cache.metadata' },
            cacheSegments: { path: 'cache.segments' },
            cacheSummaries: { path: 'cache.summaries' }
        });
    }

    setupButtons() {
        document.getElementById('clearCache')?.addEventListener('click', async () => {
            if (confirm('Clear all cached data? This cannot be undone.')) {
                await chrome.storage.local.clear();
                if (this.autoSave.notifications) {
                    this.autoSave.notifications.success('Cache cleared successfully');
                }
            }
        });

        document.getElementById('viewCacheStats')?.addEventListener('click', async () => {
            const stats = await chrome.storage.local.getBytesInUse();
            const statsDiv = document.getElementById('cacheStats');
            if (statsDiv) {
                statsDiv.className = 'status-indicator success';
                statsDiv.textContent = `Cache size: ${(stats / 1024 / 1024).toFixed(2)} MB`;
            }
        });
    }

    setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    setChecked(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    }
}
