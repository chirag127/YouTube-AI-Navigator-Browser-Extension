/**
 * Shortcut for chrome.runtime.sendMessage
 * @param {any} m - Message
 * @param {function} [c] - Callback
 * @returns {Promise<any>}
 */
export const msg = (m, c) => chrome.runtime.sendMessage(m, c);

/**
 * Shortcut for chrome.runtime.onMessage.addListener
 * @param {function} l - Listener
 */
export const listen = (l) => chrome.runtime.onMessage.addListener(l);

/**
 * Shortcut for chrome.runtime.getURL
 * @param {string} p - Path
 * @returns {string}
 */
export const url = (p) => chrome.runtime.getURL(p);

/**
 * Shortcut for chrome.runtime
 */
export const rt = chrome.runtime;

/**
 * Shortcut for chrome.runtime.getManifest
 * @returns {object}
 */
export const rg = () => chrome.runtime.getManifest();
