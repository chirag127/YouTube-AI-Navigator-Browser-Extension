import { l } from '../../../../utils/shortcuts/logging.js';
export const type = 'highlight';
export const description = 'Most important part of video (ONE timestamp only)';

export const detect = (text, context) => {
  l('ENTRY:detect.highlight');
  const { title = '' } = context.metadata || {};
  const titleWords = title.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();
  const matches = titleWords.filter(w => w.length > 3 && textLower.includes(w));
  const result = matches.length >= 2;
  l('EXIT:detect.highlight');
  return result;
};

export const validate = segments => {
  l('ENTRY:validate.highlight');
  const highlights = segments.filter(s => s.category === 'highlight');
  if (highlights.length > 1) {
    highlights.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    highlights.slice(1).forEach(h => (h.category = 'content'));
  }
  l('EXIT:validate.highlight');
  return true;
};

export const isSingleTimestamp = true;
