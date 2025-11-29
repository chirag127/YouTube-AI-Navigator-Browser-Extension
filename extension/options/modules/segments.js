import {
    SEGMENT_CATEGORIES,
    DEFAULT_SEGMENT_CONFIG,
} from "./settings-manager.js";

export class SegmentsConfig {
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
        const enableSegments = document.getElementById("enableSegments");
        const segmentsGrid = document.getElementById("segmentsGrid");

        if (enableSegments) {
            enableSegments.checked = config.segments?.enabled ?? true;
        }

        if (segmentsGrid) {
            this.renderGrid(segmentsGrid);
        }
    }

    attachListeners() {
        const enableSegments = document.getElementById("enableSegments");
        const skipAllBtn = document.getElementById("skipAllBtn");
        const speedAllBtn = document.getElementById("speedAllBtn");
        const resetAllBtn = document.getElementById("resetAllBtn");

        if (enableSegments) {
            enableSegments.addEventListener("change", (e) => {
                this.autoSave.save('segments.enabled', e.target.checked);
            });
        }

        if (skipAllBtn) {
            skipAllBtn.addEventListener("click", () => this.setAll("skip"));
        }
        if (speedAllBtn) {
            speedAllBtn.addEventListener("click", () => this.setAll("speed"));
        }
        if (resetAllBtn) {
            resetAllBtn.addEventListener("click", () => this.setAll("ignore"));
        }
    }

    renderGrid(grid) {
        const template = document.getElementById("segmentItemTemplate");
        grid.innerHTML = "";
        const config = this.settings.get();
        const categories = config.segments?.categories || {};

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

            const catConfig = categories[cat.id] || { ...DEFAULT_SEGMENT_CONFIG };
            action.value = catConfig.action;
            speedSlider.value = catConfig.speed;
            speedValue.textContent = `${catConfig.speed}x`;

            if (catConfig.action === "speed") {
                speedControl.classList.remove("hidden");
            }

            action.addEventListener("change", () => {
                const val = action.value;
                if (val === "speed") {
                    speedControl.classList.remove("hidden");
                } else {
                    speedControl.classList.add("hidden");
                }
                speedValue.textContent = `${val}x`;
                this.updateConfig(cat.id, { speed: parseFloat(val) });
            });

            grid.appendChild(clone);
        });
    }

    updateConfig(catId, updates) {
        const s = this.settings.get();
        const segments = { ...s.segments };

        if (!segments[catId]) segments[catId] = { ...DEFAULT_SEGMENT_CONFIG };
        segments[catId] = { ...segments[catId], ...updates };

        this.settings.save({ segments });
    }

    setAll(action) {
        const s = this.settings.get();
        const segments = { ...s.segments };

        SEGMENT_CATEGORIES.forEach((cat) => {
            if (!segments[cat.id])
                segments[cat.id] = { ...DEFAULT_SEGMENT_CONFIG };
            segments[cat.id] = { ...segments[cat.id], action };
        });

        this.settings.save({ segments });

        // Re-render to update UI
        const grid = document.getElementById("segmentsGrid");
        if (grid) this.renderGrid(grid);
    }
}
