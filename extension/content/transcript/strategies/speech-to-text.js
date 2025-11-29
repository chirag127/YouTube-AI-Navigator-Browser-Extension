import { l, w } from '../../../utils/shortcuts/log.js';
import { msg } from '../../../utils/shortcuts/runtime.js';

export const name = 'Speech to Text';
export const priority = 30;

export const extract = async (vid, lang = 'en') => {
  l(`[STT] Starting for ${vid}...`);
  const u = getAudioUrl();
  if (!u) throw new Error('No audio URL found');

  l('[STT] Requesting transcription...');
  const r = await msg({ action: 'TRANSCRIBE_AUDIO', audioUrl: u, lang });
  if (r?.success && r.segments) {
    l(`[STT] ✅ Success: ${r.segments.length} segments`);
    return r.segments;
  }
  throw new Error(r?.error || 'STT failed');
};

const getAudioUrl = () => {
  try {
    const pr = window.ytInitialPlayerResponse;
    if (!pr?.streamingData?.adaptiveFormats) return null;
    const f = pr.streamingData.adaptiveFormats;
    const af = f.find(x => x.mimeType.includes('audio/mp4') || x.mimeType.includes('audio/webm'));
    return af?.url || null;
  } catch (e) {
    w('[STT] Failed to extract audio URL:', e);
    return null;
  }
};
