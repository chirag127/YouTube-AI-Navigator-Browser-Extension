import { ModelManager } from "../api/gemini.js";

// Default Settings
const DEFAULT_SETTINGS = {
    outputLanguage: "en",
    autoAnalyze: true,
    saveHistory: true,
    apiKey: "",
    model: "",
    customPrompt: "",
    enableSegments: true,
    debugMode: false,
    transcriptMethod: "auto",
    transcriptLanguage: "en",
    // Segment Settings: { category: { action: 'ignore'|'skip'|'speed', speed: 2 } }
    segments: {},
};

const SEGMENT_CATEGORIES = [
    { id: "Sponsor", label: "Sponsor", color: "#00d26a" },
    { id: "Unpaid/Self Promotion", label: "Self Promotion", color: "#ffff00" },
    { id: "Exclusive Access", label: "Exclusive Access", color: "#008b45" },
    {
        id: "Interaction Reminder (Subscribe)",
        label: "Interaction",
        color: "#a020f0",
    },
    { id: "Highlight", label: "Highlight", color: "#ff0055" },
    {
        id: "Intermission/Intro Animation",
        label: "Intro/Animation",
        color: "#00ffff",
    },
    { id: "Endcards/Credits", label: "Endcards", color: "#0000ff" },
    { id: "Preview/Recap", label: "Preview/Recap", color: "#00bfff" },
    { id: "Hook/Greetings", label: "Hook/Greetings", color: "#4169e1" },
    { id: "Tangents/Jokes", label: "Tangents/Jokes", color: "#9400d3" },
];

const DEFAULT_SEGMENT_CONFIG = { action: "ignore", speed: 2 };

// DOM Elements
let elements = {};

function initializeElements() {
    elements = {
        tabs: document.querySelectorAll(".nav-item"),
        contents: document.querySelectorAll(".tab-content"),
        apiKey: document.getElementById("apiKey"),
        toggleApiKey: document.getElementById("toggleApiKey"),
        modelSelect: document.getElementById("modelSelect"),
        refreshModels: document.getElementById("refreshModels"),
        testConnection: document.getElementById("testConnection"),
        apiStatus: document.getElementById("apiStatus"),
        outputLanguage: document.getElementById("outputLanguage"),
        autoAnalyze: document.getElementById("autoAnalyze"),
        saveHistory: document.getElementById("saveHistory"),
        clearHistory: document.getElementById("clearHistory"),
        customPrompt: document.getElementById("customPrompt"),
        enableSegments: document.getElementById("enableSegments"),
        segmentsGrid: document.getElementById("segmentsGrid"),
        skipAllBtn: document.getElementById("skipAllBtn"),
        speedAllBtn: document.getElementById("speedAllBtn"),
        resetAllBtn: document.getElementById("resetAllBtn"),
        exportSettings: document.getElementById("exportSettings"),
        importSettings: document.getElementById("importSettings"),
        importFile: document.getElementById("importFile"),
        resetDefaults: document.getElementById("resetDefaults"),
        debugMode: document.getElementById("debugMode"),
        transcriptMethod: document.getElementById("transcriptMethod"),
        transcriptLanguage: document.getElementById("transcriptLanguage"),
        toast: document.getElementById("toast"),
    };
}

// State
let currentSettings = { ...DEFAULT_SETTINGS };
let modelManager = null;

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
    console.log("[Options] DOMContentLoaded fired");

    try {
        initializeElements();
        console.log("[Options] Elements initialized");

        // Setup tabs first so navigation works even if other things fail
        setupTabs();
        console.log("[Options] Tabs setup complete");

        setupEventListeners();
        console.log("[Options] Event listeners setup complete");

        await loadSettings();
        console.log("[Options] Settings loaded");

        renderSegmentsGrid();
        console.log("[Options] Segments grid rendered");

        // Initialize Model Manager
        if (ModelManager) {
            modelManager = new ModelManager(
                currentSettings.apiKey,
                "https://generativelanguage.googleapis.com/v1beta"
            );
            if (currentSettings.apiKey) {
                await refreshModelList();
            }
        }

        console.log("[Options] Initialization complete");
    } catch (e) {
        console.error("[Options] Initialization error:", e);
    }
});

// Tab Switching
function setupTabs() {
    elements.tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            // Update Active State
            elements.tabs.forEach((t) => t.classList.remove("active"));
            tab.classList.add("active");

            elements.contents.forEach((c) => {
                c.classList.remove("active");
                if (c.id === target) c.classList.add("active");
            });
        });
    });
}

// Load Settings
async function loadSettings() {
    try {
        const stored = await chrome.storage.sync.get(null);
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };

        // Ensure segments object exists and has defaults
        if (!currentSettings.segments) currentSettings.segments = {};
        SEGMENT_CATEGORIES.forEach((cat) => {
            if (!currentSettings.segments[cat.id]) {
                currentSettings.segments[cat.id] = {
                    ...DEFAULT_SEGMENT_CONFIG,
                };
            }
        });

        // Populate UI
        elements.apiKey.value = currentSettings.apiKey || "";
        elements.outputLanguage.value = currentSettings.outputLanguage || "en";
        elements.autoAnalyze.checked = currentSettings.autoAnalyze;
        elements.saveHistory.checked = currentSettings.saveHistory;
        elements.customPrompt.value = currentSettings.customPrompt || "";
        elements.enableSegments.checked = currentSettings.enableSegments;
        elements.debugMode.checked = currentSettings.debugMode;
        elements.transcriptMethod.value =
            currentSettings.transcriptMethod || "auto";
        elements.transcriptLanguage.value =
            currentSettings.transcriptLanguage || "en";

        updateSegmentsUI();
    } catch (e) {
        console.error("Failed to load settings:", e);
        showToast("Failed to load settings", "error");
    }
}

// Save Settings
async function saveSettings() {
    try {
        // Update state from UI
        currentSettings.apiKey = elements.apiKey.value.trim();
        currentSettings.model = elements.modelSelect.value;
        currentSettings.outputLanguage = elements.outputLanguage.value;
        currentSettings.autoAnalyze = elements.autoAnalyze.checked;
        currentSettings.saveHistory = elements.saveHistory.checked;
        currentSettings.customPrompt = elements.customPrompt.value.trim();
        currentSettings.enableSegments = elements.enableSegments.checked;
        currentSettings.debugMode = elements.debugMode.checked;
        currentSettings.transcriptMethod = elements.transcriptMethod.value;
        currentSettings.transcriptLanguage = elements.transcriptLanguage.value;

        // Segments are updated in real-time in the state object by event listeners

        await chrome.storage.sync.set(currentSettings);

        // Also update local storage for background script access if needed
        await chrome.storage.local.set({
            geminiApiKey: currentSettings.apiKey,
            targetLanguage: currentSettings.outputLanguage,
        });

        showToast("Settings saved");

        // Update ModelManager if key changed
        if (modelManager.apiKey !== currentSettings.apiKey) {
            modelManager = new ModelManager(
                currentSettings.apiKey,
                "https://generativelanguage.googleapis.com/v1beta"
            );
            if (currentSettings.apiKey) await refreshModelList();
        }
    } catch (e) {
        console.error("Failed to save settings:", e);
        showToast("Failed to save settings", "error");
    }
}

// Segments UI
function renderSegmentsGrid() {
    const template = document.getElementById("segmentItemTemplate");
    elements.segmentsGrid.innerHTML = "";

    SEGMENT_CATEGORIES.forEach((cat) => {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector(".segment-item");
        const color = clone.querySelector(".segment-color");
        const name = clone.querySelector(".segment-name");
        const action = clone.querySelector(".segment-action");
        const speedControl = clone.querySelector(".speed-control");
        const speedSlider = clone.querySelector(".speed-slider");
        const speedValue = clone.querySelector(".speed-value");

        item.dataset.category = cat.id;
        color.style.backgroundColor = cat.color;
        name.textContent = cat.label;

        // Set initial values
        const config = currentSettings.segments[cat.id] || {
            ...DEFAULT_SEGMENT_CONFIG,
        };
        action.value = config.action;
        speedSlider.value = config.speed;
        speedValue.textContent = `${config.speed}x`;

        if (config.action === "speed") {
            speedControl.classList.remove("hidden");
        }

        // Event Listeners
        action.addEventListener("change", () => {
            const val = action.value;
            if (val === "speed") {
                speedControl.classList.remove("hidden");
            } else {
                speedControl.classList.add("hidden");
            }
            updateSegmentConfig(cat.id, { action: val });
        });

        speedSlider.addEventListener("input", () => {
            const val = speedSlider.value;
            speedValue.textContent = `${val}x`;
            updateSegmentConfig(cat.id, { speed: parseFloat(val) });
        });

        elements.segmentsGrid.appendChild(clone);
    });
}

function updateSegmentsUI() {
    // Refresh UI from state (useful after bulk updates)
    const items = elements.segmentsGrid.querySelectorAll(".segment-item");
    items.forEach((item) => {
        const catId = item.dataset.category;
        const config = currentSettings.segments[catId];

        const action = item.querySelector(".segment-action");
        const speedControl = item.querySelector(".speed-control");
        const speedSlider = item.querySelector(".speed-slider");
        const speedValue = item.querySelector(".speed-value");

        action.value = config.action;
        speedSlider.value = config.speed;
        speedValue.textContent = `${config.speed}x`;

        if (config.action === "speed") {
            speedControl.classList.remove("hidden");
        } else {
            speedControl.classList.add("hidden");
        }
    });
}

function updateSegmentConfig(catId, updates) {
    if (!currentSettings.segments[catId]) {
        currentSettings.segments[catId] = { ...DEFAULT_SEGMENT_CONFIG };
    }
    currentSettings.segments[catId] = {
        ...currentSettings.segments[catId],
        ...updates,
    };
    saveSettings(); // Auto-save on change
}

// Bulk Actions
function setAllSegments(action) {
    SEGMENT_CATEGORIES.forEach((cat) => {
        updateSegmentConfig(cat.id, { action });
    });
    updateSegmentsUI();
}

// Model Management
async function refreshModelList() {
    const select = elements.modelSelect;
    select.innerHTML = '<option value="" disabled>Loading...</option>';
    select.disabled = true;

    try {
        const models = await modelManager.fetch();
        select.innerHTML = "";

        if (models.length === 0) {
            select.innerHTML =
                '<option value="" disabled>No models found</option>';
            return;
        }

        // Get prioritized list logic from ModelManager (it sorts them)
        // We just populate them
        models.forEach((modelName) => {
            // ModelManager already returns cleaned names (e.g. "gemini-1.5-flash")
            // but let's be safe if it changes
            const name =
                typeof modelName === "string"
                    ? modelName.replace("models/", "")
                    : modelName.name?.replace("models/", "") || modelName;

            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name; // Display name is just the ID for now
            select.appendChild(opt);
        });

        // Select current model or default
        if (
            currentSettings.model &&
            models.some((m) => m.name.includes(currentSettings.model))
        ) {
            select.value = currentSettings.model;
        } else if (modelManager.selected) {
            select.value = modelManager.selected;
            currentSettings.model = modelManager.selected;
            saveSettings();
        }
    } catch (e) {
        console.error("Failed to fetch models:", e);
        select.innerHTML =
            '<option value="" disabled>Failed to load models</option>';
        showToast("Failed to fetch models", "error");
    } finally {
        select.disabled = false;
    }
}

// Event Listeners Setup
function setupEventListeners() {
    console.log("Setting up event listeners...");
    // Auto-save on most inputs
    const autoSaveInputs = [
        elements.outputLanguage,
        elements.autoAnalyze,
        elements.saveHistory,
        elements.enableSegments,
        elements.debugMode,
        elements.transcriptMethod,
        elements.transcriptLanguage,
    ];

    autoSaveInputs.forEach((el) => {
        if (el) el.addEventListener("change", saveSettings);
    });

    if (elements.apiKey)
        elements.apiKey.addEventListener("change", saveSettings);
    if (elements.modelSelect)
        elements.modelSelect.addEventListener("change", saveSettings);
    if (elements.customPrompt)
        elements.customPrompt.addEventListener("change", saveSettings);

    // Buttons
    if (elements.toggleApiKey) {
        elements.toggleApiKey.addEventListener("click", () => {
            elements.apiKey.type =
                elements.apiKey.type === "password" ? "text" : "password";
        });
    }

    if (elements.refreshModels)
        elements.refreshModels.addEventListener("click", refreshModelList);

    if (elements.testConnection) {
        elements.testConnection.addEventListener("click", async () => {
            console.log("Test Connection clicked");
            const btn = elements.testConnection;
            const status = elements.apiStatus;

            btn.disabled = true;
            btn.textContent = "Testing...";
            status.className = "status-indicator hidden";

            try {
                if (!currentSettings.apiKey)
                    throw new Error("API Key is missing");

                const model = elements.modelSelect.value || "gemini-1.5-flash";
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentSettings.apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: "Ping" }] }],
                        }),
                    }
                );

                if (!response.ok)
                    throw new Error(`API Error: ${response.statusText}`);

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
        });
    }

    if (elements.clearHistory) {
        elements.clearHistory.addEventListener("click", async () => {
            if (confirm("Are you sure? This cannot be undone.")) {
                await chrome.storage.local.remove("summaryHistory");
                showToast("History cleared");
            }
        });
    }

    if (elements.skipAllBtn)
        elements.skipAllBtn.addEventListener("click", () =>
            setAllSegments("skip")
        );
    if (elements.speedAllBtn)
        elements.speedAllBtn.addEventListener("click", () =>
            setAllSegments("speed")
        );
    if (elements.resetAllBtn)
        elements.resetAllBtn.addEventListener("click", () =>
            setAllSegments("ignore")
        );

    if (elements.resetDefaults) {
        elements.resetDefaults.addEventListener("click", async () => {
            console.log("Reset Defaults clicked");
            if (confirm("Reset all settings to default?")) {
                currentSettings = { ...DEFAULT_SETTINGS };
                await chrome.storage.sync.clear();
                await loadSettings();
                showToast("Settings reset");
            }
        });
    }

    if (elements.exportSettings) {
        elements.exportSettings.addEventListener("click", () => {
            console.log("Export Settings clicked");
            const data = JSON.stringify(currentSettings, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "youtube-ai-master-settings.json";
            a.click();
        });
    }

    if (elements.importSettings) {
        elements.importSettings.addEventListener("click", () => {
            console.log("Import Settings clicked");
            if (elements.importFile) elements.importFile.click();
        });
    }

    if (elements.importFile) {
        elements.importFile.addEventListener("change", (e) => {
            console.log("File selected for import");
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    // Validate/Merge
                    currentSettings = { ...DEFAULT_SETTINGS, ...imported };
                    await saveSettings();
                    await loadSettings();
                    showToast("Settings imported");
                } catch (err) {
                    console.error("Import failed:", err);
                    showToast("Invalid settings file", "error");
                }
            };
            reader.readAsText(file);
        });
    }
}

function showToast(msg, type = "success") {
    const t = elements.toast;
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => t.classList.remove("show"), 3000);
}
