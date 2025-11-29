import { log, logError } from './debug.js';

export async function initializeExtension() {
  const { ru } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  log('=== YouTube AI Master Initialization ===');
  try {
    log('Step 1: Loading settings...');
    const { loadSettings } = await import(ru('content/core/state.js'));
    await loadSettings();
    log('Settings loaded ✓');

    log('Step 2: Initializing observer...');
    const { initObserver } = await import(ru('content/core/observer.js'));
    initObserver();
    log('Observer initialized ✓');

    log('Step 3: Initializing transcript service...');
    try {
      const { initTranscriptLoader } = await import(ru('content/transcript-loader.js'));
      initTranscriptLoader();
      log('Transcript service initialized ✓');
    } catch (e) {
      logError('Transcript service initialization failed (non-critical)', e);
      log('Continuing without transcript loader...');
    }

    log('Step 4: Initializing Auto-Liker...');
    try {
      const { autoLiker } = await import(ru('content/features/auto-liker.js'));
      autoLiker.init();
      log('Auto-Liker initialized ✓');
    } catch (e) {
      logError('Auto-Liker initialization failed (non-critical)', e);
    }

    log('=== Initialization Complete ✓ ===');
    return true;
  } catch (e) {
    logError('Initialization failed', e);
    return false;
  }
}

export async function waitForPageReady() {
  const { ru } = await import(chrome.runtime.getURL('utils/shortcuts/runtime.js'));
  const { d: dc, win: wn } = await import(ru('utils/shortcuts/dom.js'));
  const { on } = await import(ru('utils/shortcuts/dom.js'));
  return new Promise(r => {
    if (dc.readyState === 'complete') r();
    else on(wn, 'load', r);
  });
}
