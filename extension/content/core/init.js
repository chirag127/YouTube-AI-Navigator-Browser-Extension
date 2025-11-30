const gu = p => chrome.runtime.getURL(p);

const { e } = await import(gu('utils/shortcuts/log.js'));
export async function initializeExtension() {
  try {
    const { loadSettings } = await import(gu('content/core/state.js'));
    await loadSettings();
    const { initObserver } = await import(gu('content/core/observer.js'));
    initObserver();
    try {
      const { autoLiker } = await import(gu('content/features/auto-liker.js'));
      autoLiker.init();
    } catch (err) {
      e('Err:initializeExtension:autoLiker', err);
    }

    return true;
  } catch (err) {
    e('Err:initializeExtension', err);
    return false;
  }
}

export async function waitForPageReady() {
  try {
    const { on: ae } = await import(gu('utils/shortcuts/dom.js'));
    const p = new Promise(r => {
      if (document.readyState === 'complete') r();
      else ae(window, 'load', r);
    });
    await p;

    return p;
  } catch (err) {
    e('Err:waitForPageReady', err);
    throw err;
  }
}
