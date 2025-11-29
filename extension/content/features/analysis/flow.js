import { state } from '../../core/state.js';
import TranscriptExtractor from '../../transcript/extractor.js';
import { metadataExtractor } from '../../metadata/extractor.js';
import { getComments } from '../../handlers/comments.js';
import { showLoading, showError } from '../../ui/components/loading.js';
import { switchTab } from '../../ui/tabs.js';
import { injectSegmentMarkers } from '../../segments/markers.js';
import { setupAutoSkip } from '../../segments/autoskip.js';
import { renderTimeline } from '../../segments/timeline.js';
import { analyzeVideo } from './service.js';
import { l } from '../../utils/shortcuts/log.js';
import { cw } from '../../utils/shortcuts/windows.js';
import { id as i, $ } from '../../utils/shortcuts/dom.js';
import { msg } from '../../../utils/shortcuts/runtime.js';
import { E as Er } from '../../../utils/shortcuts/core.js';

export async function startAnalysis() {
  if (state.isAnalyzing || !state.currentVideoId) return;
  state.isAnalyzing = true;
  const ca = i('yt-ai-content-area');
  try {
    showLoading(ca, 'Extracting video metadata...');
    const md = await metadataExtractor.extract(state.currentVideoId);
    showLoading(ca, 'Extracting transcript...');
    let ts = [];
    try {
      ts = await TranscriptExtractor.extract(state.currentVideoId);
    } catch (e) {
      cw('[Flow] Transcript extraction failed:', e);
    }
    state.currentTranscript = ts || [];
    showLoading(ca, 'Extracting comments...');
    let cm = [];
    try {
      cm = await getComments();
    } catch (e) {
      cw('[Flow] Comments extraction failed:', e);
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
    } catch (e) {
      cw('[Flow] History save failed:', e);
    }
    switchTab('summary');
  } catch (e) {
    showError(ca, e.message);
  } finally {
    state.isAnalyzing = false;
  }
}

async function saveToHistory(d) {
  await msg({ action: 'SAVE_HISTORY', data: d });
}
