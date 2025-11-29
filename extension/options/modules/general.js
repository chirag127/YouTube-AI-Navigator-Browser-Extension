export class GeneralSettings {
    constructor(settingsManager, autoSave) {
        this.settings = settingsManager;
        this.autoSave = autoSave;
    }

    init() {
        this.loadSettings();
        this.attachListeners();
    }

    loadSettings() {
        const config = this.settings.get();

        // Language
        this.setValue('outputLanguage', config.ai?.outputLanguage || 'en');

        // Automation
        this.setChecked('autoAnalyze', config.automation?.autoAnalyze ?? true);
        this.setChecked('autoSummarize', config.automation?.autoSummarize ?? true);
        this.setChecked('autoExtractKeyPoints', config.automation?.autoExtractKeyPoints ?? true);
        this.setChecked('autoDetectLanguage', config.automation?.autoDetectLanguage ?? true);
        this.setChecked('autoLoadTranscript', config.automation?.autoLoadTranscript ?? true);

        // Data & Privacy
        this.setChecked('saveHistory', config.advanced?.saveHistory ?? true);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            outputLanguage: { path: 'ai.outputLanguage' },
            autoAnalyze: { path: 'automation.autoAnalyze' },
            autoSummarize: { path: 'automation.autoSummarize' },
            autoExtractKeyPoints: { path: 'automation.autoExtractKeyPoints' },
            autoDetectLanguage: { path: 'automation.autoDetectLanguage' },
            autoLoadTranscript: { path: 'automation.autoLoadTranscript' },
            saveHistory: { path: 'advanced.saveHistory' }
        });

        // Clear History
        document.getElementById('clearHistory')?.addEventListener('click', async () => {
            if (confirm('Clear all history? This cannot be undone.')) {
                await chrome.storage.local.remove('comprehensive_history');
                if (this.autoSave.notifications) {
                    this.autoSave.notifications.success('History cleared');
                }
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
