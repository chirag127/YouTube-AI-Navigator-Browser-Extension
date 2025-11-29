import { GeminiClient } from '../../api/gemini-client.js';
import { l, w, e, js, jp, rp, tr, sg, ft } from '../../utils/shortcuts-sw.js';

export async function handleTranscribeAudio(req, rsp) {
  try {
    const { audioUrl, lang } = req;
    if (!audioUrl) throw new Error('No audio URL provided');
    const s = await sg(['apiKey', 'model']);
    if (!s.apiKey) throw new Error('Gemini API key not found');
    let m = s.model || 'gemini-2.5-flash-preview-09-2025';
    if (m.startsWith('models/')) m = rp(m, 'models/', '');
    const c = new GeminiClient(s.apiKey);
    l('[TranscribeAudio] Fetching audio...', audioUrl);
    const ar = await ft(audioUrl);
    if (!ar.ok) throw new Error(`Failed to fetch audio: ${ar.status}`);
    const ab = await ar.arrayBuffer();
    const b64 = btoa(new Uint8Array(ab).reduce((d, b) => d + String.fromCharCode(b), ''));
    l(`[TranscribeAudio] Audio fetched. Size: ${ab.byteLength} bytes`);
    const pt = `Transcribe the following audio into a JSON array of segments. Language: ${lang || 'en'}. Format: JSON only. No markdown. Structure: [{"start": number (seconds), "text": "string"}]. If the audio is music or no speech, return [].`;
    const parts = [{ inlineData: { mimeType: 'audio/mp4', data: b64 } }, { text: pt }];
    l('[TranscribeAudio] Sending to Gemini...');
    const txt = await c.generateContent(parts, m);
    let seg = [];
    try {
      const cln = tr(rp(rp(txt, /```json/g, ''), /```/g, ''));
      seg = jp(cln);
    } catch (x) {
      w('[TranscribeAudio] JSON parse failed, trying to extract array', x);
      const m = txt.match(/\[.*\]/s);
      if (m) seg = jp(m[0]);
      else throw new Error('Failed to parse transcription response');
    }
    rsp({ success: true, segments: seg });
  } catch (x) {
    e('[TranscribeAudio] Error:', x);
    rsp({ success: false, error: x.message });
  }
}
