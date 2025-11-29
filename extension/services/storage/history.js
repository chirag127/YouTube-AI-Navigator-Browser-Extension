import { sl } from '../../utils/shortcuts/storage.js';
import { nw as nt } from '../../utils/shortcuts/core.js';
import { lwc } from '../../utils/shortcuts/string.js';
import { aic as inc } from '../../utils/shortcuts/array.js';

export async function getHistory() {
  const r = await sl('history_index');
  return r.history_index || [];
}
export async function updateHistory(v, m) {
  const i = await getHistory(),
    n = i.filter(x => x.videoId !== v);
  n.unshift({ videoId: v, title: m.title, author: m.author, timestamp: nt() });
  await sl({ history_index: n });
}
export async function deleteFromHistory(v) {
  const i = await getHistory();
  await sl({ history_index: i.filter(x => x.videoId !== v) });
}
export async function searchHistory(q) {
  if (!q) return getHistory();
  const i = await getHistory(),
    l = lc(q);
  return i.filter(x => (x.title && inc(lc(x.title), l)) || (x.author && inc(lc(x.author), l)));
}
