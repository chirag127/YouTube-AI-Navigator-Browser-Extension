import { l, e, w } from '../utils/shortcuts/log.js';
import { rt as cr } from '../utils/shortcuts/runtime.js';
import { tab } from '../utils/shortcuts/tabs.js';
import { url, rg } from '../utils/shortcuts/runtime.js';
cr.onInstalled.addListener(async d => {
  if (d.reason === 'install') {
    l('YAM installed');
    try {
      await tab({ url: url('onboarding/onboarding.html') });
    } catch (x) {
      e('Onboard:', x);
    }
  } else if (d.reason === 'update') l('YAM updated:', rg().version);
});
cr.onMessage.addListener((q, s, r) => {
  const a = q.action || q.type;
  l('BG:', a);
  (async () => {
    try {
      const { verifySender: vs } = await import('./security/sender-check.js');
      if (!vs(s)) {
        r({ success: false, error: 'Unauthorized' });
        return;
      }
      const { validateMessage: vm, sanitizeRequest: sr } = await import('./security/validator.js');
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
        case 'GET_SETTINGS': {
          const { handleGetSettings: h } = await import('./handlers/settings.js');
          await h(r);
          break;
        }
        case 'FETCH_TRANSCRIPT': {
          const { handleFetchTranscript: h } = await import('./handlers/fetch-transcript.js');
          await h(n, r);
          break;
        }
        case 'ANALYZE_VIDEO': {
          const { handleAnalyzeVideo: h } = await import('./handlers/analyze-video.js');
          await h(n, r);
          break;
        }
        case 'ANALYZE_COMMENTS': {
          const { handleAnalyzeComments: h } = await import('./handlers/comments.js');
          await h(n, r);
          break;
        }
        case 'CHAT_WITH_VIDEO': {
          const { handleChatWithVideo: h } = await import('./handlers/chat.js');
          await h(n, r);
          break;
        }
        case 'SAVE_TO_HISTORY': {
          const { handleSaveToHistory: h } = await import('./handlers/history.js');
          await h(n, r);
          break;
        }
        case 'SAVE_HISTORY': {
          const { handleSaveHistory: h } = await import('./handlers/video-data.js');
          r(await h(n));
          break;
        }
        case 'GET_METADATA': {
          const { handleGetMetadata: h } = await import('./handlers/metadata.js');
          await h(n, r);
          break;
        }

        case 'GET_CACHED_DATA': {
          const { handleGetCachedData: h } = await import('./handlers/cache.js');
          await h(n, r);
          break;
        }
        case 'SAVE_CHAT_MESSAGE': {
          const { handleSaveChatMessage: h } = await import('./handlers/chat-history.js');
          await h(n, r);
          break;
        }
        case 'SAVE_COMMENTS': {
          const { handleSaveComments: h } = await import('./handlers/comments-storage.js');
          await h(n, r);
          break;
        }
        case 'TRANSCRIBE_AUDIO': {
          const { handleTranscribeAudio: h } = await import('./handlers/transcribe-audio.js');
          await h(n, r);
          break;
        }
        case 'GET_LYRICS': {
          const { handleGetLyrics: h } = await import('./handlers/get-lyrics.js');
          await h(n, r);
          break;
        }
        case 'GET_VIDEO_DATA': {
          const { handleGetVideoData: h } = await import('./handlers/video-data.js');
          r(await h(n));
          break;
        }
        case 'OPEN_OPTIONS':
          cr.openOptionsPage();
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
