import { log, logError } from './debug.js';
import { rt, on } from '../utils/shortcuts.js';

export async function initializeExtension() {
  log('=== YouTube AI Master Initialization ===');
  try {
    log('Step 1: Loading settings...');
    const { loadSettings } = await import(rt.getURL('content/core/state.js'));
    await loadSettings();
    log('Settings loaded ✓');

    log('Step 2: Initializing observer...');
    const { initObserver } = await import(rt.getURL('content/core/observer.js'));
    initObserver();
    log('Observer initialized ✓');

    log('Step 3: Initializing transcript service...');
    try {
      const { initTranscriptLoader } = await import(rt.getURL('content/transcript-loader.js'));
      initTranscriptLoader();
      log('Transcript service initialized ✓');
    } catch (e) {
      logError('Transcript service initialization failed (non-critical)', e);
      log('Continuing without transcript loader...');
    }

    log('Step 4: Initializing Auto-Liker...');
    try {
      const { autoLiker } = await import(rt.getURL('content/features/auto-liker.js'));
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

export function waitForPageReady() {
  return new Promise(r => {
    if (document.readyState === 'complete') r();
    else on(window, 'load', r);
  });
}
