import { rt as cr } from '../../utils/shortcuts/runtime.js';

export const verifySender = s => {
  if (!s || !s.id) {
    return false;
  }
  if (s.id !== cr.id) {
    return false;
  }

  if (s.tab && !s.tab.url?.includes('youtube.com')) {
    return false;
  }

  return true;
};

export const isFromContentScript = s => {
  const result = s?.tab?.id && s?.url?.includes('youtube.com');

  return result;
};
export const isFromExtensionPage = s => {
  const result = s?.url?.startsWith(`chrome-extension://${cr.id}`);

  return result;
};
