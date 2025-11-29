export class TabLoader {
    constructor() {
        this.tabs = {
            general: 'tabs/general.html',
            cache: 'tabs/cache.html',
            transcript: 'tabs/transcript.html',
            comments: 'tabs/comments.html',
            metadata: 'tabs/metadata.html',
            scroll: 'tabs/scroll.html',
            performance: 'tabs/performance.html',
            notifications: 'tabs/notifications.html'
        };
        this.loaded = new Set();
    }

    async load(tabId) {
        if (this.loaded.has(tabId)) return true;

        const path = this.tabs[tabId];
        if (!path) return false;

        try {
            const response = await fetch(chrome.runtime.getURL(`options/${path}`));
            const html = await response.text();

            const container = document.querySelector('.content-area');
            container.insertAdjacentHTML('beforeend', html);

            this.loaded.add(tabId);
            console.log(`[TabLoader] Loaded ${tabId}`);
            return true;
        } catch (e) {
            console.error(`[TabLoader] Failed to load ${tabId}:`, e);
            return false;
        }
    }

    async loadAll() {
        await Promise.all(Object.keys(this.tabs).map(id => this.load(id)));
    }
}
