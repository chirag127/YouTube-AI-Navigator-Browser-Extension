import { ft } from '../../../utils/shortcuts/network.js';
import { l, e } from '../../../utils/shortcuts/log.js';
import { mp } from '../../../utils/shortcuts/array.js';
import { parse } from '../../../services/transcript/parsers/vtt.js';

export const name = 'Invidious API';
export const priority = 20;

export async function fetchTranscript(videoId, lang = 'en') {
  const instances = [
    'https://inv.tux.pizza',
    'https://invidious.fdn.fr',
    'https://invidious.drgns.space',
    'https://vid.puffyan.us',
  ];

  for (const inst of instances) {
    try {
      l(`[Invidious] Trying ${inst}`);
      const r = await ft(`${inst}/api/v1/captions/${videoId}`);
      if (!r.ok) continue;
      const d = await r.json();
      const c = d.captions?.find(t => t.languageCode.startsWith(lang));
      if (!c) continue;

      const r2 = await ft(`${inst}${c.url}`);
      if (!r2.ok) continue;
      const vtt = await r2.text();
      return parse(vtt);
    } catch (x) {
      e(`[Invidious] ${inst} failed:`, x);
    }
  }
  throw new Error('Invidious failed');
}
