const gu = p => chrome.runtime.getURL(p);

const { msg } = await import(gu('utils/shortcuts/runtime.js'));
const { e } = await import(gu('utils/shortcuts/log.js'));
export async function analyzeVideo(t, m, c = [], o = { length: 'Medium' }) {
  try {
    const result = await msg({
      action: 'ANALYZE_VIDEO',
      transcript: t,
      metadata: m,
      comments: c,
      options: o,
    });
    return result;
  } catch (err) {
    e('Err:analyzeVideo', err);
    throw err;
  }
}
