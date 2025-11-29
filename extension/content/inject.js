(function () {
  try {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL('content/transcript/xhr-interceptor.js');
    s.type = 'module';
    (document.head || document.documentElement).appendChild(s);
    s.onload = function () {
      this.remove();
    };
    console.log('[YouTube AI Master] Interceptor injected');
  } catch (e) {
    console.error('[YouTube AI Master] Failed to inject interceptor:', e);
  }
})();
