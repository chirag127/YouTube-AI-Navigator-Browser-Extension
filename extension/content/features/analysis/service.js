const gu = p => chrome.runtime.getURL(p);

const { msg } = await import(gu('utils/shortcuts/runtime.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
export async function analyzeVideo(t, m, c = [], o = { length: 'Medium' }) {
  l('analyzeVideo:Start');
  try {
    l('[Service] Sending ANALYZE_VIDEO message', {
      transcriptLength: t?.length,
      commentsCount: c?.length,
      metadata: m,
      options: o,
    });
    const result = await msg({
      action: 'ANALYZE_VIDEO',
      transcript: t,
      metadata: m,
      comments: c,
      options: o,
    });
    l('analyzeVideo:End');
    return result;
  } catch (err) {
    e('Err:analyzeVideo', err);
    throw err;
  }
}
