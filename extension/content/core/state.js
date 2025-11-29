import { slg } from '../../utils/shortcuts/storage.js';
import { assign } from '../../utils/shortcuts/core.js';

export const state = {
  currentVideoId: null,
  isAnalyzing: false,
  analysisData: null,
  currentTranscript: [],
  settings: {
    autoAnalyze: true,
    autoSkipSponsors: false,
    autoSkipIntros: false,
    autoLike: false,
    autoLikeThreshold: 50,
    autoLikeLive: false,
    likeIfNotSubscribed: false,
  },
};
export function resetState() {
  state.isAnalyzing = false;
  state.analysisData = null;
  state.currentTranscript = [];
}
export async function loadSettings() {
  try {
    const r = await slg([
      'autoAnalyze',
      'autoSkipSponsors',
      'autoSkipIntros',
      'autoLike',
      'autoLikeThreshold',
      'autoLikeLive',
      'likeIfNotSubscribed',
    ]);
    assign(state.settings, r);
    return state.settings;
  } catch (e) {
    return state.settings;
  }
}
