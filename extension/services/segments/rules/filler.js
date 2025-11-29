import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'filler';
export const description = 'Non-essential off-topic content, jokes, fake sponsors';

export const detect = text => {
  l('ENTRY:detect.filler');
  const patterns = [/by the way/i, /speaking of/i, /random.*but/i, /off topic/i, /quick.*story/i];
  const result = patterns.some(p => p.test(text));
  l('EXIT:detect.filler');
  return result;
};
