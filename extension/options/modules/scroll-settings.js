export class ScrollSettings {
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

        this.setChecked('autoScrollToComments', config.scroll?.autoScrollToComments ?? false);
        this.setChecked('scrollBackAfterComments', config.scroll?.scrollBackAfterComments ?? true);
        this.setChecked('showScrollNotification', config.scroll?.showScrollNotification ?? true);
        this.setChecked('smoothScroll', config.scroll?.smoothScroll ?? true);
        this.setValue('scrollSpeed', config.scroll?.scrollSpeed || 'medium');
        this.setValue('autoScrollDelay', config.scroll?.autoScrollDelay || 500);

        // UI settings
        this.setValue('uiTheme', config.ui?.theme || 'dark');
        this.setValue('uiFontSize', config.ui?.fontSize || 'medium');
        this.setChecked('uiAnimationsEnabled', config.ui?.animationsEnabled ?? true);
        this.setChecked('uiShowTooltips', config.ui?.showTooltips ?? true);
        this.setChecked('uiCompactMode', config.ui?.compactMode ?? false);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            autoScrollToComments: { path: 'scroll.autoScrollToComments' },
            scrollBackAfterComments: { path: 'scroll.scrollBackAfterComments' },
            showScrollNotification: { path: 'scroll.showScrollNotification' },
            smoothScroll: { path: 'scroll.smoothScroll' },
            scrollSpeed: { path: 'scroll.scrollSpeed' },
            autoScrollDelay: { path: 'scroll.autoScrollDelay', transform: (v) => parseInt(v) },
            uiTheme: { path: 'ui.theme' },
            uiFontSize: { path: 'ui.fontSize' },
            uiAnimationsEnabled: { path: 'ui.animationsEnabled' },
            uiShowTooltips: { path: 'ui.showTooltips' },
            uiCompactMode: { path: 'ui.compactMode' }
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
