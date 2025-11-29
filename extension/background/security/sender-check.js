import { rt } from '../../utils/shortcuts-sw.js';

// Sender verification for MV3 security
export const verifySender = s => {
  // Verify message is from our extension
  if (!s || !s.id) return false;
  if (s.id !== rt.id) return false;
  // Content scripts should have tab info
  if (s.tab && !s.tab.url?.includes('youtube.com')) return false;
  return true;
};

export const isFromContentScript = s => s?.tab?.id && s?.url?.includes('youtube.com');
export const isFromExtensionPage = s => s?.url?.startsWith(`chrome-extension://${rt.id}`);
