import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'sponsor';
export const description = 'Paid promotion of product/service not directly related to creator';

export const detect = text => {
  l('ENTRY:detect.sponsor');
  const keywords = ['sponsor', 'brought to you by', 'thanks to', 'partnered with', 'affiliate'];
  const score = keywords.reduce((s, k) => s + (text.toLowerCase().includes(k) ? 1 : 0), 0);
  const result = score > 0;
  l('EXIT:detect.sponsor');
  return result;
};

export const validate = (segment, allSegments) => {
  l('ENTRY:validate.sponsor');
  const totalDuration = allSegments.reduce((sum, s) => sum + (s.end - s.start), 0);
  const segmentDuration = segment.end - segment.start;
  if (segmentDuration / totalDuration > 0.8) {
    l('EXIT:validate.sponsor');
    return false;
  }
  l('EXIT:validate.sponsor');
  return true;
};
