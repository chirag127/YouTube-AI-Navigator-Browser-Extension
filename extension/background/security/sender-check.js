import { rt as cr } from '../../utils/shortcuts/runtime.js';
import { l, e, w } from '../../utils/shortcuts/logging.js';

export const verifySender = s => {
  l('VerifySender');
  if (!s || !s.id) {
    l('VerifySender:Done');
    return false;
  }
  if (s.id !== cr.id) {
    l('VerifySender:Done');
    return false;
  }

  if (s.tab && !s.tab.url?.includes('youtube.com')) {
    l('VerifySender:Done');
    return false;
  }
  l('VerifySender:Done');
  return true;
};

export const isFromContentScript = s => {
  l('IsFromContentScript');
  const result = s?.tab?.id && s?.url?.includes('youtube.com');
  l('IsFromContentScript:Done');
  return result;
};
export const isFromExtensionPage = s => {
  l('IsFromExtensionPage');
  const result = s?.url?.startsWith(`chrome-extension://${cr.id}`);
  l('IsFromExtensionPage:Done');
  return result;
};
