import { slg, sls } from '../../utils/shortcuts/storage.js';
import { nw as now } from '../../utils/shortcuts/core.js';
export async function handleSaveToHistory(req, rsp) {
  const { videoId, title, summary, timestamp } = req.data || req;
  const res = await slg('summaryHistory');
  const h = res.summaryHistory || [];
  h.unshift({ videoId, title, summary, timestamp: timestamp || now() });
  await sls({ summaryHistory: h.slice(0, 100) });
  rsp({ success: true });
}
