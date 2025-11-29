export class NotificationsSettings {
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

        this.setChecked('notificationsEnabled', config.notifications?.enabled ?? true);
        this.setValue('notificationPosition', config.notifications?.position || 'top-right');
        this.setValue('notificationDuration', config.notifications?.duration || 3000);
        this.setChecked('notificationSound', config.notifications?.sound ?? false);
        this.setChecked('notifyOnSave', config.notifications?.showOnSave ?? true);
        this.setChecked('notifyOnError', config.notifications?.showOnError ?? true);
        this.setChecked('notifyOnProgress', config.notifications?.showProgress ?? true);
        this.setChecked('notifyOnComplete', config.notifications?.showOnComplete ?? true);
        this.setChecked('notifyOnSegmentSkip', config.notifications?.showOnSegmentSkip ?? true);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            notificationsEnabled: { path: 'notifications.enabled' },
            notificationPosition: { path: 'notifications.position' },
            notificationDuration: { path: 'notifications.duration', transform: (v) => parseInt(v) },
            notificationSound: { path: 'notifications.sound' },
            notifyOnSave: { path: 'notifications.showOnSave' },
            notifyOnError: { path: 'notifications.showOnError' },
            notifyOnProgress: { path: 'notifications.showProgress' },
            notifyOnComplete: { path: 'notifications.showOnComplete' },
            notifyOnSegmentSkip: { path: 'notifications.showOnSegmentSkip' }
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
