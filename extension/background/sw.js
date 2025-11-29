import { l, w, e, rt, tab, url } from '../utils/shortcuts-sw.js';
rt.onInstalled.addListener(async d => {
    if (d.reason === 'install') {
        l('YouTube AI Master installed');
        try {
            await tab({ url: url('onboarding/onboarding.html') });
        } catch (x) {
            e('Failed to open onboarding:', x);
        }
    } else if (d.reason === 'update') {
        l('YouTube AI Master updated to version', rt.getManifest().version);
    }
});
rt.onMessage.addListener((req, snd, rsp) => {
    const act = req.action || req.type;
    l('Background received message:', act);
    (async () => {
        try {
            const { verifySender } = await import('./security/sender-check.js');
            if (!verifySender(snd)) {
                rsp({ success: false, error: 'Unauthorized' });
                return;
            }
            const { validateMessage, sanitizeRequest } = await import('./security/validator.js');
            const val = validateMessage(req);
            if (!val.valid) {
                rsp({ success: false, error: val.error });
                return;
            }
            const san = sanitizeRequest(req);
            switch (act) {
                case 'TEST':
                    rsp({
                        success: true,
                        message: 'Background script is running',
                    });
                    break;
                case 'GET_SETTINGS': {
                    const { handleGetSettings } = await import('./handlers/settings.js');
                    await handleGetSettings(rsp);
                    break;
                }
                case 'FETCH_TRANSCRIPT': {
                    const { handleFetchTranscript } = await import('./handlers/fetch-transcript.js');
                    await handleFetchTranscript(san, rsp);
                    break;
                }
                case 'ANALYZE_VIDEO': {
                    const { handleAnalyzeVideo } = await import('./handlers/analyze-video.js');
                    await handleAnalyzeVideo(san, rsp);
                    break;
                }
                case 'ANALYZE_COMMENTS': {
                    const { handleAnalyzeComments } = await import('./handlers/comments.js');
                    await handleAnalyzeComments(san, rsp);
                    break;
                }
                case 'CHAT_WITH_VIDEO': {
                    const { handleChatWithVideo } = await import('./handlers/chat.js');
                    await handleChatWithVideo(san, rsp);
                    break;
                }
                case 'SAVE_TO_HISTORY': {
                    const { handleSaveToHistory } = await import('./handlers/history.js');
                    await handleSaveToHistory(san, rsp);
                    break;
                }
                case 'SAVE_HISTORY': {
                    const { handleSaveHistory } = await import('./handlers/video-data.js');
                    rsp(await handleSaveHistory(san));
                    break;
                }
                case 'GET_METADATA': {
                    const { handleGetMetadata } = await import('./handlers/metadata.js');
                    await handleGetMetadata(san, rsp);
                    break;
                }
                case 'FETCH_INVIDIOUS_TRANSCRIPT': {
                    const { handleFetchInvidiousTranscript } = await import('./handlers/invidious.js');
                    rsp(await handleFetchInvidiousTranscript(san));
                    break;
                }
                case 'FETCH_INVIDIOUS_METADATA': {
                    const { handleFetchInvidiousMetadata } = await import('./handlers/invidious.js');
                    rsp(await handleFetchInvidiousMetadata(san));
                    break;
                }
                case 'GET_CACHED_DATA': {
                    const { handleGetCachedData } = await import('./handlers/cache.js');
                    await handleGetCachedData(san, rsp);
                    break;
                }
                case 'SAVE_CHAT_MESSAGE': {
                    const { handleSaveChatMessage } = await import('./handlers/chat-history.js');
                    await handleSaveChatMessage(san, rsp);
                    break;
                }
                case 'SAVE_COMMENTS': {
                    const { handleSaveComments } = await import('./handlers/comments-storage.js');
                    await handleSaveComments(san, rsp);
                    break;
                }
                case 'TRANSCRIBE_AUDIO': {
                    const { handleTranscribeAudio } = await import('./handlers/transcribe-audio.js');
                    await handleTranscribeAudio(san, rsp);
                    break;
                }
                case 'GET_LYRICS': {
                    const { handleGetLyrics } = await import('./handlers/get-lyrics.js');
                    await handleGetLyrics(san, rsp);
                    break;
                }
                case 'GET_VIDEO_DATA': {
                    const { handleGetVideoData } = await import('./handlers/video-data.js');
                    rsp(await handleGetVideoData(san));
                    break;
                }
                case 'OPEN_OPTIONS':
                    rt.openOptionsPage();
                    rsp({ success: true });
                    break;
                default:
                    w('Unknown message type:', act);
                    rsp({ success: false, error: 'Unknown message type' });
            }
        } catch (err) {
            e('Background handler error:', err);
            rsp({ success: false, error: err.message });
        }
    })();
    return true;
});
