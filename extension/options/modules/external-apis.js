export class ExternalAPIs {
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
        const apis = config.externalApis || {};

        this.setValue('tmdbApiKey', apis.tmdb || '');
        this.setValue('twitchClientId', apis.twitchClientId || '');
        this.setValue('twitchAccessToken', apis.twitchAccessToken || '');
        this.setValue('newsDataApiKey', apis.newsData || '');
        this.setValue('googleFactCheckApiKey', apis.googleFactCheck || '');
    }

    attachListeners() {
        this.autoSave.attachToAll({
            tmdbApiKey: { path: 'externalApis.tmdb' },
            twitchClientId: { path: 'externalApis.twitchClientId' },
            twitchAccessToken: { path: 'externalApis.twitchAccessToken' },
            newsDataApiKey: { path: 'externalApis.newsData' },
            googleFactCheckApiKey: { path: 'externalApis.googleFactCheck' }
        });
    }

    setValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }
}
