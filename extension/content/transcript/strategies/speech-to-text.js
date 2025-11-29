const gu = p => chrome.runtime.getURL(p);

const { log: l, warn: w } = await import(gu('utils/shortcuts/core.js'));
const { msg } = await import(gu('utils/shortcuts/runtime.js'));
export const name = 'Speech to Text';
export const priority = 30;

export const extract = async (vid, lang = 'en') => {
  l(`[STT] Starting for ${vid}...`);
  const u = await getAudioUrl();
  if (!u) throw new Error('No audio URL found');

  l('[STT] Requesting transcription...');
  const r = await msg({ action: 'TRANSCRIBE_AUDIO', audioUrl: u, lang });
  if (r?.success && r.segments) {
    l(`[STT] ✅ Success: ${r.segments.length} segments`);
    return r.segments;
  }
  throw new Error(r?.error || 'STT failed');
};

const getAudioUrl = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const pr = window.ytInitialPlayerResponse;
      if (!pr?.streamingData?.adaptiveFormats) {
        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        return null;
      }
      const f = pr.streamingData.adaptiveFormats;
      let af = f.find(x => x.mimeType.includes('audio/mp4'));
      if (!af) af = f.find(x => x.mimeType.includes('audio/webm'));
      if (!af) af = f.find(x => x.mimeType.includes('audio'));
      return af?.url || null;
    } catch (e) {
      w('[STT] Failed to extract audio URL:', e);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  return null;
};
