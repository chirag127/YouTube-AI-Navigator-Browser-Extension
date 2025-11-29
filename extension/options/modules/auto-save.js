// Auto-Save Utility with Debouncing
export class AutoSave {
    constructor(settingsManager, delay = 500, notificationManager = null) {
        this.settings = settingsManager;
        this.delay = delay;
        this.timeout = null;
        this.notifications = notificationManager;
        this.saveCount = 0;
    }

    async save(path, value) {
        clearTimeout(this.timeout);

        if (this.notifications) {
            this.notifications.saving('Saving...');
        }

        this.timeout = setTimeout(async () => {
            try {
                console.log(`[AutoSave] Saving ${path} =`, value);
                await this.settings.update(path, value);
                this.saveCount++;

                if (this.notifications) {
                    this.notifications.success(`Setting saved: ${path.split('.').pop()}`);
                }

                console.log(`[AutoSave] ✓ Saved successfully (count: ${this.saveCount})`);
            } catch (e) {
                console.error('[AutoSave] Failed:', e);

                if (this.notifications) {
                    this.notifications.error(`Failed to save: ${e.message}`);
                }
            }
        }, this.delay);
    }

    attachToInput(element, path, transform = (v) => v) {
        if (!element) return;

        const handler = (e) => {
            const value = element.type === 'checkbox'
                ? element.checked
                : element.value;
            this.save(path, transform(value));
        };

        element.addEventListener('change', handler);
        element.addEventListener('input', handler);
    }

    attachToAll(mappings) {
        Object.entries(mappings).forEach(([id, config]) => {
            const el = document.getElementById(id);
            if (el) {
                this.attachToInput(el, config.path, config.transform);
            }
        });
    }
}
