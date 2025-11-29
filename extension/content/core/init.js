import { l, e } from '../../utils/shortcuts/global.js';
export async function initializeExtension() {
  const { ru } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  l('YAM: Init');
  try {
    const { loadSettings } = await import(ru('content/core/state.js'));
    await loadSettings();
    const { initObserver } = await import(ru('content/core/observer.js'));
    initObserver();
    try {
      const { autoLiker } = await import(ru('content/features/auto-liker.js'));
      autoLiker.init();
    } catch (err) {
      e('AL init fail', err);
    }
    return true;
  } catch (err) {
    e('Init fail', err);
    return false;
  }
}
export async function waitForPageReady() {
  const { ae } = await import(chrome.runtime.getURL('utils/shortcuts/dom.js'));
  return new Promise(r => {
    if (document.readyState === 'complete') r();
    else ae(window, 'load', r);
  });
}
