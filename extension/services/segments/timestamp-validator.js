import { flr as mfl } from '../../utils/shortcuts/math.js';
import { pI as pS } from '../../utils/shortcuts/global.js';
import { isa } from '../../utils/shortcuts/array.js';
import { l } from '../../utils/shortcuts/logging.js';

export const validateSegments = s => {
  l('ENTRY:validateSegments');
  if (!isa(s)) {
    l('EXIT:validateSegments');
    return [];
  }
  const result = s
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
  l('EXIT:validateSegments');
  return result;
};
export const formatTimestamp = s => {
  l('ENTRY:formatTimestamp');
  const h = mfl(s / 3600),
    m = mfl((s % 3600) / 60),
    sc = mfl(s % 60);
  const result = h > 0 ? `${h}:${pad(m)}:${pad(sc)}` : `${m}:${pad(sc)}`;
  l('EXIT:formatTimestamp');
  return result;
};
const pad = n => pS(n.toString(), 2, '0');
export const createClickableTimestamp = (t, y, c) => {
  l('ENTRY:createClickableTimestamp');
  const result = {
    time: t,
    type: y,
    formatted: formatTimestamp(t),
    clickable: true,
    onClick: () => c(t),
  };
  l('EXIT:createClickableTimestamp');
  return result;
};
