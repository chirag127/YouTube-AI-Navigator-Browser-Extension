import { msg } from '../../../utils/shortcuts/runtime.js';
import { l } from '../../../utils/shortcuts/log.js';

export async function analyzeVideo(t, m, c = [], o = { length: 'Medium' }) {
  l('[Service] Sending ANALYZE_VIDEO message', {
    transcriptLength: t?.length,
    commentsCount: c?.length,
    metadata: m,
    options: o,
  });
  return msg({ action: 'ANALYZE_VIDEO', transcript: t, metadata: m, comments: c, options: o });
}
