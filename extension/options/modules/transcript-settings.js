export class TranscriptSettings {
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

        this.setValue('transcriptMethod', config.transcript?.method || 'auto');
        this.setValue('transcriptLanguage', config.transcript?.language || 'en');
        this.setChecked('includeTimestamps', config.transcript?.includeTimestamps ?? true);
        this.setChecked('transcriptAutoTranslate', config.transcript?.autoTranslate ?? true);
        this.setChecked('transcriptShowOriginal', config.transcript?.showOriginal ?? false);
        this.setChecked('transcriptHighlightKeywords', config.transcript?.highlightKeywords ?? true);
        this.setChecked('transcriptAutoClose', config.transcript?.autoClose ?? true);
        this.setValue('transcriptAutoCloseDelay', config.transcript?.autoCloseDelay || 1000);
        this.setChecked('transcriptAutoCloseOnCached', config.transcript?.autoCloseOnCached ?? false);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            transcriptMethod: { path: 'transcript.method' },
            transcriptLanguage: { path: 'transcript.language' },
            includeTimestamps: { path: 'transcript.includeTimestamps' },
            transcriptAutoTranslate: { path: 'transcript.autoTranslate' },
            transcriptShowOriginal: { path: 'transcript.showOriginal' },
            transcriptHighlightKeywords: { path: 'transcript.highlightKeywords' },
            transcriptAutoClose: { path: 'transcript.autoClose' },
            transcriptAutoCloseDelay: { path: 'transcript.autoCloseDelay', transform: (v) => parseInt(v) },
            transcriptAutoCloseOnCached: { path: 'transcript.autoCloseOnCached' }
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
