export function findSecondaryColumn() {
    // YouTube's modern layout selectors in priority order
    const selectors = [
        '#secondary-inner',
        '#secondary',
        '#related',
        'ytd-watch-next-secondary-results-renderer',
        '#columns #secondary',
        'ytd-watch-flexy #secondary'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        // Check if element exists and is visible (offsetWidth/Height > 0 is more reliable than offsetParent)
        if (element && (element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0)) {
            return element;
        }
    }

    // Fallback: try to find any secondary column even if not visible yet
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }

    return null;
}
export function seekVideo(t) { const v = document.querySelector('video'); if (v) { v.currentTime = t; v.play() } }
export function getVideoElement() { return document.querySelector('video') }
export function decodeHTML(h) { const t = document.createElement('textarea'); t.innerHTML = h; return t.value }
