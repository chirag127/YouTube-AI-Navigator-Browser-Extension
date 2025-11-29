const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
export async function initializeExtension() {
  l('initializeExtension:Start');
  try {
    l('YAM: Init');
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
    l('initializeExtension:End');
    return true;
  } catch (err) {
    e('Err:initializeExtension', err);
    return false;
  }
}

export async function waitForPageReady() {
  l('waitForPageReady:Start');
  try {
    const { on: ae } = await import(gu('utils/shortcuts/dom.js'));
    const p = new Promise(r => {
      if (document.readyState === 'complete') r();
      else ae(window, 'load', r);
    });
    await p;
    l('waitForPageReady:End');
    return p;
  } catch (err) {
    e('Err:waitForPageReady', err);
    throw err;
  }
}
