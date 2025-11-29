export class MetadataSettings {
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

        this.setChecked('includeTitle', config.metadata?.includeTitle ?? true);
        this.setChecked('includeAuthor', config.metadata?.includeAuthor ?? true);
        this.setChecked('includeDescription', config.metadata?.includeDescription ?? true);
        this.setChecked('includeTags', config.metadata?.includeTags ?? true);
        this.setChecked('includeCategory', config.metadata?.includeCategory ?? true);
        this.setChecked('includeViews', config.metadata?.includeViews ?? true);
        this.setChecked('includeLikes', config.metadata?.includeLikes ?? true);
        this.setChecked('includeDuration', config.metadata?.includeDuration ?? true);
        this.setChecked('includeUploadDate', config.metadata?.includeUploadDate ?? true);
        this.setChecked('includeChapters', config.metadata?.includeChapters ?? true);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            includeTitle: { path: 'metadata.includeTitle' },
            includeAuthor: { path: 'metadata.includeAuthor' },
            includeDescription: { path: 'metadata.includeDescription' },
            includeTags: { path: 'metadata.includeTags' },
            includeCategory: { path: 'metadata.includeCategory' },
            includeViews: { path: 'metadata.includeViews' },
            includeLikes: { path: 'metadata.includeLikes' },
            includeDuration: { path: 'metadata.includeDuration' },
            includeUploadDate: { path: 'metadata.includeUploadDate' },
            includeChapters: { path: 'metadata.includeChapters' }
        });
    }

    setChecked(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    }
}
