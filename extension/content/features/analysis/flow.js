const gu = p => chrome.runtime.getURL(p);

const { state } = await import(gu('content/core/state.js'));
const { extractTranscript } = await import(gu('content/transcript/strategy-manager.js'));
const { metadataExtractor } = await import(gu('content/metadata/extractor.js'));
const { getComments } = await import(gu('content/handlers/comments.js'));
const { showLoading, showError } = await import(gu('content/ui/components/loading.js'));
const { switchTab } = await import(gu('content/ui/tabs.js'));
const { injectSegmentMarkers } = await import(gu('content/segments/markers.js'));
const { setupAutoSkip } = await import(gu('content/segments/autoskip.js'));
const { renderTimeline } = await import(gu('content/segments/timeline.js'));
const { analyzeVideo } = await import(gu('content/features/analysis/service.js'));
const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { id: i, $ } = await import(gu('utils/shortcuts/dom.js'));
const { msg } = await import(gu('utils/shortcuts/runtime.js'));
const { E: Er } = await import(gu('utils/shortcuts/core.js'));
export async function startAnalysis() {
  l('startAnalysis:Start');
  if (state.isAnalyzing || !state.currentVideoId) return;
  state.isAnalyzing = true;
  const ca = i('yt-ai-content-area');
  try {
    showLoading(ca, 'Extracting video metadata...');
    const md = await metadataExtractor.extract(state.currentVideoId);
    showLoading(ca, 'Extracting transcript...');
    let ts = [];
    try {
      const result = await extractTranscript(state.currentVideoId);
      ts = result.success ? result.data : [];
    } catch (err) {
      l('[Flow] Transcript extraction failed:', err);
    }
    state.currentTranscript = ts || [];
    showLoading(ca, 'Extracting comments...');
    let cm = [];
    try {
      cm = await getComments();
    } catch (err) {
      l('[Flow] Comments extraction failed:', err);
    }
    showLoading(ca, `Analyzing content with AI...`);
    l('[Flow] Starting AI analysis...', {
      transcriptLength: ts?.length,
      commentsCount: cm?.length,
    });
    const r = await analyzeVideo(ts, md, cm);
    l('[Flow] AI analysis result received', r);
    if (!r.success) throw new Er(r.error || 'Analysis failed');
    state.analysisData = r.data;
    if (state.analysisData.segments) {
      injectSegmentMarkers(state.analysisData.segments);
      setupAutoSkip(state.analysisData.segments);
      const v = $('video');
      if (v) renderTimeline(state.analysisData.segments, v.duration);
    }
    try {
      await saveToHistory({
        videoId: state.currentVideoId,
        metadata: md,
        transcript: ts,
        comments: cm,
        commentAnalysis: state.analysisData.commentAnalysis,
        segments: state.analysisData.segments,
        summary: state.analysisData.summary,
        comprehensiveReview: state.analysisData.comprehensive,
        faq: state.analysisData.faq,
        keyPoints: state.analysisData.keyPoints,
        chatHistory: state.chatHistory || [],
      });
    } catch (err) {
      l('[Flow] History save failed:', err);
    }
    switchTab('summary');
    l('startAnalysis:End');
  } catch (err) {
    showError(ca, err.message);
    e('Err:startAnalysis', err);
  } finally {
    state.isAnalyzing = false;
  }
}

async function saveToHistory(d) {
  l('saveToHistory:Start');
  try {
    await msg({ action: 'SAVE_HISTORY', data: d });
    l('saveToHistory:End');
  } catch (err) {
    e('Err:saveToHistory', err);
  }
}
