export const type = 'selfpromo';
export const description = 'Self promotion and unpaid promotion (merged category)';

export const detect = text => {
  const keywords = [
    'merch',
    'patreon',
    'buy my',
    'check out my',
    'my course',
    'my book',
    'shout out',
    'shoutout',
    'check out',
    'charity',
    'donate',
    'support',
    'friend',
    'channel',
  ];
  const result = keywords.some(k => text.toLowerCase().includes(k));
  return result;
};
