export class CommentsSettings {
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

        this.setChecked('commentsEnabled', config.comments?.enabled ?? true);
        this.setValue('commentsLimit', config.comments?.limit || 20);
        this.setChecked('includeReplies', config.comments?.includeReplies ?? true);
        this.setValue('commentsSortBy', config.comments?.sortBy || 'top');
        this.setChecked('analyzeSentiment', config.comments?.analyzeSentiment ?? true);
        this.setChecked('filterSpam', config.comments?.filterSpam ?? true);
        this.setChecked('showAuthorBadges', config.comments?.showAuthorBadges ?? true);
        this.setChecked('highlightPinned', config.comments?.highlightPinned ?? true);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            commentsEnabled: { path: 'comments.enabled' },
            commentsLimit: { path: 'comments.limit', transform: (v) => parseInt(v) },
            includeReplies: { path: 'comments.includeReplies' },
            commentsSortBy: { path: 'comments.sortBy' },
            analyzeSentiment: { path: 'comments.analyzeSentiment' },
            filterSpam: { path: 'comments.filterSpam' },
            showAuthorBadges: { path: 'comments.showAuthorBadges' },
            highlightPinned: { path: 'comments.highlightPinned' }
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
