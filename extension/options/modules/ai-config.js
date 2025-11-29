import { ModelManager } from "../../api/gemini.js";

export class AIConfig {
    constructor(settingsManager, uiManager) {
        this.settings = settingsManager;
        this.ui = uiManager;
        this.modelManager = null;
    }

    async init() {
        const s = this.settings.get();

        // Initialize ModelManager
        if (ModelManager) {
            this.modelManager = new ModelManager(
                s.apiKey,
                "https://generativelanguage.googleapis.com/v1beta"
            );
        }

        const els = {
            apiKey: document.getElementById("apiKey"),
            toggleApiKey: document.getElementById("toggleApiKey"),
            modelSelect: document.getElementById("modelSelect"),
            refreshModels: document.getElementById("refreshModels"),
            testConnection: document.getElementById("testConnection"),
            apiStatus: document.getElementById("apiStatus"),
            customPrompt: document.getElementById("customPrompt"),
        };

        // Load values
        if (els.apiKey) els.apiKey.value = s.apiKey || "";
        if (els.customPrompt) els.customPrompt.value = s.customPrompt || "";

        // Listeners
        if (els.apiKey) {
            els.apiKey.addEventListener("change", async (e) => {
                const newKey = e.target.value.trim();
                await this.settings.save({ apiKey: newKey });

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
                els.apiKey.type =
                    els.apiKey.type === "password" ? "text" : "password";
            });
        }

        if (els.customPrompt) {
            els.customPrompt.addEventListener("change", (e) =>
                this.settings.save({ customPrompt: e.target.value.trim() })
            );
        }

        if (els.modelSelect) {
            els.modelSelect.addEventListener("change", (e) => {
                let model = e.target.value;
                // Ensure no models/ prefix
                if (model.startsWith("models/")) {
                    model = model.replace("models/", "");
                }
                this.settings.save({ model });
            });
        }

        if (els.refreshModels) {
            els.refreshModels.addEventListener("click", () =>
                this.refreshModelList(els.modelSelect)
            );
        }

        if (els.testConnection) {
            els.testConnection.addEventListener("click", () =>
                this.testConnection(els)
            );
        }

        // Initial load of models if key exists
        if (s.apiKey) {
            await this.refreshModelList(els.modelSelect);
        }
    }

    async refreshModelList(select) {
        if (!select) return;
        select.innerHTML = '<option value="" disabled>Loading...</option>';
        select.disabled = true;

        try {
            const models = await this.modelManager.fetch();
            select.innerHTML = "";

            if (models.length === 0) {
                select.innerHTML =
                    '<option value="" disabled>No models found</option>';
                return;
            }

            models.forEach((modelName) => {
                const name =
                    typeof modelName === "string"
                        ? modelName.replace("models/", "")
                        : modelName.name?.replace("models/", "") || modelName;

                const opt = document.createElement("option");
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });

            const s = this.settings.get();
            let savedModel = s.model;

            // Strip models/ prefix from saved model if present
            if (savedModel && savedModel.startsWith("models/")) {
                savedModel = savedModel.replace("models/", "");
                // Update storage with cleaned model name
                this.settings.save({ model: savedModel });
            }

            if (savedModel && models.includes(savedModel)) {
                select.value = savedModel;
            } else if (models.length > 0) {
                // Select first available model
                select.value = models[0];
                this.settings.save({ model: models[0] });
            }
        } catch (e) {
            console.error("Failed to fetch models:", e);
            select.innerHTML =
                '<option value="" disabled>Failed to load models</option>';
            this.ui.showToast("Failed to fetch models", "error");
        } finally {
            select.disabled = false;
        }
    }

    async testConnection(els) {
        const btn = els.testConnection;
        const status = els.apiStatus;
        const s = this.settings.get();

        btn.disabled = true;
        btn.textContent = "Testing...";
        status.className = "status-indicator hidden";

        try {
            if (!s.apiKey) throw new Error("API Key is missing");

            let model =
                els.modelSelect.value || "gemini-2.5-flash-preview-09-2025";

            // Ensure model name doesn't have 'models/' prefix for the URL
            if (model.startsWith("models/")) {
                model = model.replace("models/", "");
            }

            // Add -latest suffix ONLY if it's a base model name without version/date
            // Don't add if it has a date (e.g. -09-2025), version number (e.g. -001), or is experimental/preview
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
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${s.apiKey}`,
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
                throw new Error(
                    errorData.error?.message || response.statusText
                );
            }

            status.textContent = "Connection Successful!";
            status.className = "status-indicator success";
            status.classList.remove("hidden");
        } catch (e) {
            status.textContent = `Connection Failed: ${e.message}`;
            status.className = "status-indicator error";
            status.classList.remove("hidden");
        } finally {
            btn.disabled = false;
            btn.textContent = "Test Connection";
        }
    }
}
