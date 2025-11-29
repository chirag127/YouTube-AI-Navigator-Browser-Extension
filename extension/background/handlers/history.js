import { lg, ls } from '../../utils/shortcuts-sw.js';

export async function handleSaveToHistory(req, rsp) {
  const { videoId, title, summary, timestamp } = req.data || req;
  const res = await lg('summaryHistory');
  const h = res.summaryHistory || [];
  h.unshift({ videoId, title, summary, timestamp: timestamp || Date.now() });
  await ls({ summaryHistory: h.slice(0, 100) });
  rsp({ success: true });
}
