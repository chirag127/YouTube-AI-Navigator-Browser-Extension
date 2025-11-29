import { slg, sls } from '../../utils/shortcuts/storage.js';
import { nw as now } from '../../utils/shortcuts/core.js';
import { l, e } from '../../utils/shortcuts/logging.js';
export async function handleSaveToHistory(req, rsp) {
  l('SaveHistory');
  try {
    const { videoId, title, summary, timestamp } = req.data || req;
    const res = await slg('summaryHistory');
    const h = res.summaryHistory || [];
    h.unshift({ videoId, title, summary, timestamp: timestamp || now() });
    await sls({ summaryHistory: h.slice(0, 100) });
    l('SaveHistory:OK');
    rsp({ success: true });
  } catch (x) {
    e('SaveHistory:', x);
    rsp({ success: false, error: x.message });
  }
}
