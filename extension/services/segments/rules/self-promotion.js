import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'selfpromo';
export const description = 'Promoting own merchandise or monetized platforms';

export const detect = text => {
  l('ENTRY:detect.selfpromo');
  const keywords = ['merch', 'patreon', 'buy my', 'check out my', 'my course', 'my book'];
  const result = keywords.some(k => text.toLowerCase().includes(k));
  l('EXIT:detect.selfpromo');
  return result;
};
