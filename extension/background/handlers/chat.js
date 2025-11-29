import { initializeServices, getServices } from '../services.js';
import { getApiKey } from '../utils/api-key.js';
export async function handleChatWithVideo(req, rsp) {
  const { question, context, metadata } = req;
  const k = await getApiKey();
  if (!k) {
    rsp({ success: false, error: 'API Key not configured' });
    return;
  }
  await initializeServices(k);
  const { gemini } = getServices();
  const ctx = `Video Metadata:\nTitle: ${metadata?.title || 'Unknown'}\nChannel: ${metadata?.author || 'Unknown'}\n\nTranscript Context:\n${context}\n`;
  const ans = await gemini.chatWithVideo(question, ctx, null);
  rsp({ success: true, answer: ans });
}
