import { log as l, err as e } from '../../utils/shortcuts/core.js';
import { getUrl as gu } from '../../utils/shortcuts/runtime.js';

export async function initializeExtension() {
  l('YAM: Init');
  try {
    const { loadSettings } = await import(gu('content/core/state.js'));
    await loadSettings();
    const { initObserver } = await import(gu('content/core/observer.js'));
    initObserver();
    try {
      const { autoLiker } = await import(gu('content/features/auto-liker.js'));
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
  const { on: ae } = await import(gu('utils/shortcuts/dom.js'));
  return new Promise(r => {
    if (document.readyState === 'complete') r();
    else ae(window, 'load', r);
  });
}
