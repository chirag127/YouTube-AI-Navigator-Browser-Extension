const gu = p => chrome.runtime.getURL(p);

const { l, e } = await import(gu('utils/shortcuts/logging.js'));
const { getCfg } = await import(gu('utils/config.js'));
const { vals } = await import(gu('utils/shortcuts/core.js'));
const domAutomation = await import(gu('content/transcript/strategies/dom-automation.js'));
const genius = await import(gu('content/transcript/strategies/genius.js'));
const speechToText = await import(gu('content/transcript/strategies/speech-to-text.js'));
const strategyMap = {
  'dom-automation': domAutomation,
  genius: genius,
  'speech-to-text': speechToText,
};
const defaultOrder = ['dom-automation', 'genius', 'speech-to-text'];

export const extractTranscript = async (vid, lang = 'en') => {
  l('extractTranscript:Start');
  try {
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
          l('extractTranscript:End');
          return { success: true, data: r, method: s.name };
        }
      } catch (x) {
        err = x;
        l(`[Tr] ${s.name} fail:`, x.message);
      }
    }
    e('Err:extractTranscript', err?.message || 'All fail');
    return { success: false, error: err?.message || 'All fail' };
  } catch (error) {
    e('Err:extractTranscript', error);
    return { success: false, error: error.message };
  }
};

export const getAvailableStrategies = () => {
  l('getAvailableStrategies:Start');
  try {
    const result = vals(strategyMap).map(s => ({
      name: s.name,
      priority: s.priority,
    }));
    l('getAvailableStrategies:End');
    return result;
  } catch (err) {
    e('Err:getAvailableStrategies', err);
    return [];
  }
};
