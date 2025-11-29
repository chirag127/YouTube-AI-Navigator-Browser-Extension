import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'preview';
export const description = 'Clips showing what is coming up or what happened';

export const detect = text => {
  l('ENTRY:detect.preview');
  const patterns = [
    /coming up/i,
    /up next/i,
    /previously/i,
    /recap/i,
    /to summarize/i,
    /in this video.*going to/i,
  ];
  const result = patterns.some(p => p.test(text));
  l('EXIT:detect.preview');
  return result;
};
