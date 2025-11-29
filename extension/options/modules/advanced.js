export class AdvancedSettings {
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
        this.setChecked('debugMode', config.advanced?.debugMode ?? false);
    }

    attachListeners() {
        this.autoSave.attachToAll({
            debugMode: { path: 'advanced.debugMode' }
        });

        const els = {
            exportSettings: document.getElementById("exportSettings"),
            importSettings: document.getElementById("importSettings"),
            importFile: document.getElementById("importFile"),
            resetDefaults: document.getElementById("resetDefaults"),
        };

        if (els.exportSettings) {
            els.exportSettings.addEventListener("click", () => {
                const data = JSON.stringify(this.settings.get(), null, 2);
                const blob = new Blob([data], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "youtube-ai-master-settings.json";
                a.click();
            });
        }

        if (els.importSettings) {
            els.importSettings.addEventListener("click", () => {
                if (els.importFile) els.importFile.click();
            });
        }

        if (els.importFile) {
            els.importFile.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        const imported = JSON.parse(ev.target.result);
                        const success = await this.settings.import(JSON.stringify(imported));
                        if (success) {
                            if (this.autoSave.notifications) {
                                this.autoSave.notifications.success('Settings imported successfully');
                            }
                            setTimeout(() => window.location.reload(), 1000);
                        } else {
                            throw new Error('Import failed');
                        }
                    } catch (err) {
                        console.error("Import failed:", err);
                        if (this.autoSave.notifications) {
                            this.autoSave.notifications.error('Invalid settings file');
                        }
                    }
                };
                reader.readAsText(file);
            });
        }

        if (els.resetDefaults) {
            els.resetDefaults.addEventListener("click", async () => {
                if (confirm("Reset all settings to default? This cannot be undone.")) {
                    await this.settings.reset();
                    if (this.autoSave.notifications) {
                        this.autoSave.notifications.success('Settings reset to defaults');
                    }
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
        }
    }

    setChecked(id, checked) {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
    }
}
