import { ModelManager } from "../../api/gemini.js";

export class AIConfig {
    constructor(settingsManager, autoSave) {
        this.settings = settingsManager;
        this.autoSave = autoSave;
        this.modelManager = null;
    }

    async init() {
        this.loadSettings();
        this.attachListeners();
    }

    loadSettings() {
        const config = this.settings.get();

        // Initialize ModelManager
        if (ModelManager && config.ai?.apiKey) {
            this.modelManager = new ModelManager(
                config.ai.apiKey,
                "https://generativelanguage.googleapis.com/v1beta"
            );
        }

        const els = {
            apiKey: document.getElementById("apiKey"),
            modelSelect: document.getElementById("modelSelect"),
            customPrompt: document.getElementById("customPrompt"),
        };

        // Load values from correct path
        if (els.apiKey) els.apiKey.value = config.ai?.apiKey || "";
        if (els.customPrompt) els.customPrompt.value = config.ai?.customPrompt || "";
        if (els.modelSelect && config.ai?.model) {
            els.modelSelect.value = config.ai.model;
        }

        // Initial load of models if key exists
        if (config.ai?.apiKey) {
            this.refreshModelList(els.modelSelect);
        }
    }

    attachListeners() {
        const els = {
            apiKey: document.getElementById("apiKey"),
            toggleApiKey: document.getElementById("toggleApiKey"),
            modelSelect: document.getElementById("modelSelect"),
            refreshModels: document.getElementById("refreshModels"),
            testConnection: document.getElementById("testConnection"),
            customPrompt: document.getElementById("customPrompt"),
        };

        // API Key with auto-save
        if (els.apiKey) {
            els.apiKey.addEventListener("change", async (e) => {
                const newKey = e.target.value.trim();
                await this.autoSave.save('ai.apiKey', newKey);

                // Re-init model manager
                this.modelManager = new ModelManager(
                    newKey,
                    "https://generativelanguage.googleapis.com/v1beta"
                );
                if (newKey) await this.refreshModelList(els.modelSelect);
            });
        }

        if (els.toggleApiKey) {
            els.toggleApiKey.addEventListener("click", () => {
                els.apiKey.type = els.apiKey.type === "password" ? "text" : "password";
            });
        }

        // Custom prompt with auto-save
        if (els.customPrompt) {
            this.autoSave.attachToInput(els.customPrompt, 'ai.customPrompt');
        }

        // Model selection with auto-save
        if (els.modelSelect) {
            els.modelSelect.addEventListener("change", (e) => {
                let model = e.target.value;
                if (model.startsWith("models/")) {
                    model = model.replace("models/", "");
                }
                this.autoSave.save('ai.model', model);
            });
        }

        if (els.refreshModels) {
            els.refreshModels.addEventListener("click", () =>
                this.refreshModelList(els.modelSelect)
            );
        }

        if (els.testConnection) {
            els.testConnection.addEventListener("click", () =>
                this.testConnection()
            );
        }
    }

    async refreshModelList(select) {
        if (!select) return;
        select.innerHTML = '<option value="" disabled>Loading...</option>';
        select.disabled = true;

        try {
            if (!this.modelManager) {
                throw new Error('Model manager not initialized. Please set API key first.');
            }

            const models = await this.modelManager.fetch();
            select.innerHTML = "";

            if (models.length === 0) {
                select.innerHTML = '<option value="" disabled>No models found</option>';
                return;
            }

            models.forEach((modelName) => {
                const name = typeof modelName === "string"
                    ? modelName.replace("models/", "")
                    : modelName.name?.replace("models/", "") || modelName;

                const opt = document.createElement("option");
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });

            const config = this.settings.get();
            let savedModel = config.ai?.model;

            if (savedModel && savedModel.startsWith("models/")) {
                savedModel = savedModel.replace("models/", "");
                await this.autoSave.save('ai.model', savedModel);
            }

            if (savedModel && models.includes(savedModel)) {
                select.value = savedModel;
            } else if (models.length > 0) {
                select.value = models[0];
                await this.autoSave.save('ai.model', models[0]);
            }
        } catch (e) {
            console.error("Failed to fetch models:", e);
            select.innerHTML = '<option value="" disabled>Failed to load models</option>';
            if (this.autoSave.notifications) {
                this.autoSave.notifications.error(`Failed to fetch models: ${e.message}`);
            }
        } finally {
            select.disabled = false;
        }
    }

    async testConnection() {
        const btn = document.getElementById("testConnection");
        const status = document.getElementById("apiStatus");
        const modelSelect = document.getElementById("modelSelect");
        const config = this.settings.get();

        btn.disabled = true;
        btn.textContent = "Testing...";
        status.className = "status-indicator hidden";

        try {
            if (!config.ai?.apiKey) throw new Error("API Key is missing");

            let model = modelSelect?.value || config.ai?.model || "gemini-2.0-flash-exp";

            if (model.startsWith("models/")) {
                model = model.replace("models/", "");
            }

            if (
                !model.includes("-latest") &&
                !model.match(/-\d{3}$/) &&
                !model.match(/-\d{2}-\d{4}$/) &&
                !model.includes("preview") &&
                !model.includes("exp")
            ) {
                model = model + "-latest";
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.ai.apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Ping" }] }],
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || response.statusText);
            }

            status.textContent = "✓ Connection Successful!";
            status.className = "status-indicator success";
            status.classList.remove("hidden");

            if (this.autoSave.notifications) {
                this.autoSave.notifications.success('API connection verified');
            }
        } catch (e) {
            status.textContent = `✗ Connection Failed: ${e.message}`;
            status.className = "status-indicator error";
            status.classList.remove("hidden");

            if (this.autoSave.notifications) {
                this.autoSave.notifications.error(`Connection failed: ${e.message}`);
            }
        } finally {
            btn.disabled = false;
            btn.textContent = "Test Connection";
        }
    }
}
