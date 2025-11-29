import * as domAutomation from './strategies/dom-automation.js';
import * as genius from './strategies/genius.js';
import * as speechToText from './strategies/speech-to-text.js';
import { l, w, e } from '../../utils/shortcuts/log.js';
import { getCfg } from '../../utils/config.js';

const strategyMap = {
  'dom-automation': domAutomation,
  'genius': genius,
  'speech-to-text': speechToText
};

const defaultOrder = ['dom-automation', 'genius', 'speech-to-text'];

export const extractTranscript = async (vid, lang = 'en') => {
  l(`[Transcript] Starting extraction for ${vid}, lang: ${lang}`);

  const cfg = await getCfg().load();
  const order = cfg.tr?.so || defaultOrder;

  const strategies = order
    .map(key => strategyMap[key])
    .filter(Boolean);

  let err = null;
  for (const s of strategies) {
    try {
      l(`[Transcript] Trying: ${s.name}`);
      const r = await s.extract(vid, lang);
      if (r && r.length > 0) {
        l(`[Transcript] ✅ ${s.name} succeeded: ${r.length} segments`);
        return { success: true, data: r, method: s.name };
      }
    } catch (x) {
      err = x;
      w(`[Transcript] ${s.name} failed:`, x.message);
    }
  }
  e('[Transcript] All methods failed');
  return { success: false, error: err?.message || 'All extraction methods failed' };
};

export const getAvailableStrategies = () =>
  Object.values(strategyMap).map(s => ({
    name: s.name,
    priority: s.priority,
  }));
