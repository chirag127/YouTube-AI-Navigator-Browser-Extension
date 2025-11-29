import * as domAutomation from './strategies/dom-automation.js';
import * as genius from './strategies/genius.js';
import * as speechToText from './strategies/speech-to-text.js';
import { log as l, warn as w, err as e, vals } from '../../utils/shortcuts/core.js';
import { getCfg } from '../../utils/config.js';

const strategyMap = {
  'dom-automation': domAutomation,
  genius: genius,
  'speech-to-text': speechToText,
};
const defaultOrder = ['dom-automation', 'genius', 'speech-to-text'];

export const extractTranscript = async (vid, lang = 'en') => {
  l(`[Tr] Extr ${vid}, ${lang}`);
  const cfg = await getCfg().load();
  const order = cfg.tr?.so || defaultOrder;
  const strategies = order.map(key => strategyMap[key]).filter(Boolean);
  let err = null;
  for (const s of strategies) {
    try {
      l(`[Tr] Try: ${s.name}`);
      const r = await s.extract(vid, lang);
      if (r && r.length > 0) {
        l(`[Tr] ✅ ${s.name}: ${r.length}`);
        return { success: true, data: r, method: s.name };
      }
    } catch (x) {
      err = x;
      w(`[Tr] ${s.name} fail:`, x.message);
    }
  }
  e('[Tr] All fail');
  return { success: false, error: err?.message || 'All fail' };
};

export const getAvailableStrategies = () =>
  vals(strategyMap).map(s => ({
    name: s.name,
    priority: s.priority,
  }));
