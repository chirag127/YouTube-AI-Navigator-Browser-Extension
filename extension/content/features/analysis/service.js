import { msg, log as l } from '../../../utils/shortcuts/core.js';

export async function analyzeVideo(t, m, c = [], o = { length: 'Medium' }) {
  l('[Service] Sending ANALYZE_VIDEO message', {
    transcriptLength: t?.length,
    commentsCount: c?.length,
    metadata: m,
    options: o,
  });
  return msg({ action: 'ANALYZE_VIDEO', transcript: t, metadata: m, comments: c, options: o });
}
