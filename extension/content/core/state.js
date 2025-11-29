const gu = p => chrome.runtime.getURL(p);
let slg, assign;
const { l, e } = await import(gu('utils/shortcuts/logging.js'));

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
  l('resetState:Start');
  try {
    state.isAnalyzing = false;
    state.analysisData = null;
    state.currentTranscript = [];
    l('resetState:End');
  } catch (err) {
    e('Err:resetState', err);
  }
}
export async function loadSettings() {
  l('loadSettings:Start');
  try {
    if (!slg) {
      const storage = await import(gu('utils/shortcuts/storage.js'));
      slg = storage.slg;
      const core = await import(gu('utils/shortcuts/core.js'));
      assign = core.assign;
    }
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
    l('loadSettings:End');
    return state.settings;
  } catch (err) {
    e('Err:loadSettings', err);
    return state.settings;
  }
}
