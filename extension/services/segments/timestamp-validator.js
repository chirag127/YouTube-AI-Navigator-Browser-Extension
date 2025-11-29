import { flr as mfl } from '../../utils/shortcuts/math.js';
import { pI as pS } from '../../utils/shortcuts/global.js';
import { isa } from '../../utils/shortcuts/array.js';

export const validateSegments = s => {
  if (!isa(s)) return [];
  return s
    .map(g => {
      let st = parseFloat(g.start);
      if (isNaN(st)) st = 0;
      let en = parseFloat(g.end);
      if (isNaN(en) || en === -1) en = st + (parseFloat(g.duration) || 0);
      const v = { ...g, start: st, end: en };
      if (g.label === 'Highlight') {
        v.timestamps = [{ type: 'start', time: st }];
        v.hasEndTimestamp = false;
      } else {
        v.timestamps = [
          { type: 'start', time: st },
          { type: 'end', time: en },
        ];
        v.hasEndTimestamp = true;
      }
      return v;
    })
    .filter(x => x);
};
export const formatTimestamp = s => {
  const h = mfl(s / 3600),
    m = mfl((s % 3600) / 60),
    sc = mfl(s % 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(sc)}` : `${m}:${pad(sc)}`;
};
const pad = n => pS(n.toString(), 2, '0');
export const createClickableTimestamp = (t, y, c) => ({
  time: t,
  type: y,
  formatted: formatTimestamp(t),
  clickable: true,
  onClick: () => c(t),
});
