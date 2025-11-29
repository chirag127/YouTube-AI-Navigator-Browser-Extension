import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'interaction';
export const description = 'Explicit reminders to like, subscribe, or interact';

export const detect = text => {
  l('ENTRY:detect.interaction');
  const patterns = [
    /like.*subscribe/i,
    /subscribe.*bell/i,
    /hit.*like/i,
    /smash.*like/i,
    /leave.*comment/i,
  ];
  const result = patterns.some(p => p.test(text));
  l('EXIT:detect.interaction');
  return result;
};
