import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
import { mfl, mp, jn } from '../../utils/shortcuts-sw.js';

export async function handleGenerateSummary(req, rsp) {
  const { transcript, settings, metadata } = req;
  const k = settings?.apiKey || (await getApiKey());
  if (!k) {
    rsp({ success: false, error: 'API Key not configured' });
    return;
  }
  await initializeServices(k);
  const { gemini } = getServices();
  const ft = s => {
    const m = mfl(s / 60);
    const sec = mfl(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };
  const ts = Array.isArray(transcript)
    ? jn(
      mp(transcript, t => `[${ft(t.start)}] ${t.text}`),
      '\n'
    )
    : transcript;
  const ctx = `Video Metadata:\nTitle: ${metadata?.title || 'Unknown'}\nChannel: ${metadata?.author || 'Unknown'}\n\nTranscript:\n${ts}\n`;
  const sum = await gemini.generateSummary(ctx, settings?.customPrompt, settings?.model, {
    length: settings?.summaryLength,
    language: settings?.outputLanguage,
  });
  rsp({ success: true, data: sum });
}
