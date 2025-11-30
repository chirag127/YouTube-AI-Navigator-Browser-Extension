import { l, e, w } from '../utils/shortcuts/log.js';
import { rt as cr, url, rgm as rg, oop } from '../utils/shortcuts/runtime.js';
import { tbc as tc } from '../utils/shortcuts/tabs.js';
import { ael } from '../utils/shortcuts.js';
import { verifySender as vs } from './security/sender-check.js';
import { validateMessage as vm, sanitizeRequest as sr } from './security/validator.js';
import { handleGetSettings } from './handlers/settings.js';
import { handleFetchTranscript } from './handlers/fetch-transcript.js';
import { handleAnalyzeVideo } from './handlers/analyze-video.js';
import { handleAnalyzeComments } from './handlers/comments.js';
import { handleChatWithVideo } from './handlers/chat.js';
import { handleSaveToHistory } from './handlers/history.js';
import { handleSaveHistory, handleGetVideoData } from './handlers/video-data.js';
import { handleGetMetadata } from './handlers/metadata.js';
import { handleGetCachedData } from './handlers/cache.js';
import { handleSaveChatMessage } from './handlers/chat-history.js';
import { handleSaveComments } from './handlers/comments-storage.js';
import { handleTranscribeAudio } from './handlers/transcribe-audio.js';
import { handleGetLyrics } from './handlers/get-lyrics.js';

cr.onInstalled.addListener(async d => {
  if (d.reason === 'install') {
    try {
      await tc({ url: url('onboarding/onboarding.html') });
    } catch (x) {
      e('Onboard:', x);
    }
  } else if (d.reason === 'update') l('YAM updated:', rg().version);
});
cr.onMessage.addListener((q, s, r) => {
  const a = q.action || q.type;
  (async () => {
    try {
      if (!vs(s)) {
        r({ success: false, error: 'Unauthorized' });
        return;
      }
      const v = vm(q);
      if (!v.valid) {
        r({ success: false, error: v.error });
        return;
      }
      const n = sr(q);
      switch (a) {
        case 'TEST':
          r({ success: true, message: 'BG running' });
          break;
        case 'GET_SETTINGS':
          await handleGetSettings(r);
          break;
        case 'FETCH_TRANSCRIPT':
          await handleFetchTranscript(n, r);
          break;
        case 'ANALYZE_VIDEO':
          await handleAnalyzeVideo(n, r);
          break;
        case 'ANALYZE_COMMENTS':
          await handleAnalyzeComments(n, r);
          break;
        case 'CHAT_WITH_VIDEO':
          await handleChatWithVideo(n, r);
          break;
        case 'SAVE_TO_HISTORY':
          await handleSaveToHistory(n, r);
          break;
        case 'SAVE_HISTORY':
          r(await handleSaveHistory(n));
          break;
        case 'GET_METADATA':
          await handleGetMetadata(n, r);
          break;
        case 'GET_CACHED_DATA':
          await handleGetCachedData(n, r);
          break;
        case 'SAVE_CHAT_MESSAGE':
          await handleSaveChatMessage(n, r);
          break;
        case 'SAVE_COMMENTS':
          await handleSaveComments(n, r);
          break;
        case 'TRANSCRIBE_AUDIO':
          await handleTranscribeAudio(n, r);
          break;
        case 'GET_LYRICS':
          await handleGetLyrics(n, r);
          break;
        case 'GET_VIDEO_DATA':
          r(await handleGetVideoData(n));
          break;
        case 'OPEN_OPTIONS':
          oop();
          r({ success: true });
          break;
        default:
          w('Unknown:', a);
          r({ success: false, error: 'Unknown' });
      }
    } catch (x) {
      e('BG err:', x);
      r({ success: false, error: x.message });
    }
  })();
  return true;
});

ael(self, 'fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;
          return fetch(event.request);
        } catch (error) {
          e('Err:Fetch', error);
          return fetch(event.request);
        }
      })()
    );
  }
});
