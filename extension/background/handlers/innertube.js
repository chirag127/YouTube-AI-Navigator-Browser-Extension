// InnerTube Background Handler
// Loads YouTube.js in background context and handles requests from content scripts

import { Innertube } from '../../lib/youtubei.js';
import { diagnostics } from '../utils/innertube-diagnostics.js';

let innertubeInstance = null;

async function getClient() {
    if (innertubeInstance) {
        console.log('[InnerTube BG] ♻️ Reusing existing client instance');
        return innertubeInstance;
    }

    console.log('[InnerTube BG] 🔧 Initializing YouTube.js client...');

    // Get YouTube cookies from the browser
    const cookies = await chrome.cookies.getAll({ domain: '.youtube.com' });
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log('[InnerTube BG] 🍪 Retrieved cookies:', {
        count: cookies.length,
        hasSAPISID: cookies.some(c => c.name === 'SAPISID'),
        hasSSID: cookies.some(c => c.name === 'SSID'),
        hasSID: cookies.some(c => c.name === 'SID'),
        cookieNames: cookies.map(c => c.name).join(', ')
    });

    const config = {
        fetch: (input, init) => {
            console.log('[InnerTube BG] 🌐 Fetch intercepted:', {
                url: typeof input === 'string' ? input : input.url,
                method: init?.method || 'GET',
                hasBody: !!init?.body,
                headers: init?.headers
            });
            return fetch(input, init);
        },
        cookie: cookieString || undefined,
        generate_session_locally: false,
        retrieve_player: false,
        enable_session_cache: true
    };

    console.log('[InnerTube BG] 📋 Client config:', {
        hasCookies: !!cookieString,
        cookieLength: cookieString?.length || 0,
        generate_session_locally: config.generate_session_locally,
        retrieve_player: config.retrieve_player,
        enable_session_cache: config.enable_session_cache
    });

    innertubeInstance = await Innertube.create(config);

    console.log('[InnerTube BG] ✅ Client initialized successfully');
    return innertubeInstance;
}

export async function handleGetTranscript(request) {
    const startTime = Date.now();
    try {
        const { videoId, lang = 'en' } = request;
        console.log(`[InnerTube BG] 📝 === TRANSCRIPT FETCH START ===`);
        console.log(`[InnerTube BG] 📹 Video ID: ${videoId}`);
        console.log(`[InnerTube BG] 🌐 Language: ${lang}`);

        // Step 1: Get client
        console.log(`[InnerTube BG] 🔧 Step 1: Getting InnerTube client...`);
        const client = await getClient();
        console.log(`[InnerTube BG] ✅ Client obtained`);

        // Step 2: Get video info
        console.log(`[InnerTube BG] 📊 Step 2: Fetching video info...`);
        const info = await client.getInfo(videoId);
        console.log(`[InnerTube BG] ✅ Video info obtained:`, {
            title: info.basic_info?.title,
            hasCaptions: !!info.captions
        });

        if (!info.captions) {
            throw new Error('No captions available');
        }

        // Step 3: Get transcript
        console.log(`[InnerTube BG] 📝 Step 3: Fetching transcript...`);
        const transcriptInfo = await info.getTranscript();
        console.log(`[InnerTube BG] ✅ Transcript info obtained:`, {
            hasLanguages: !!transcriptInfo.languages,
            availableLanguages: transcriptInfo.languages?.join(', ') || 'none'
        });

        let segments;
        if (lang !== 'en' && transcriptInfo.languages?.includes(lang)) {
            console.log(`[InnerTube BG] 🌐 Selecting language: ${lang}`);
            const localized = awaittranscriptInfo.selectLanguage(lang);
            segments = formatSegments(
                localized.transcript?.content?.body?.initial_segments ||
                localized.transcript?.content?.initial_segments || []
            );
        } else {
            console.log(`[InnerTube BG] 🌐 Using default language`);
            segments = formatSegments(
                transcriptInfo.transcript?.content?.body?.initial_segments ||
                transcriptInfo.transcript?.content?.initial_segments || []
            );
        }

        const elapsed = Date.now() - startTime;
        console.log(`[InnerTube BG] ✅ === TRANSCRIPT FETCH COMPLETE ===`);
        console.log(`[InnerTube BG] 📊 Results:`, {
            success: true,
            segmentsCount: segments.length,
            elapsedMs: elapsed
        });

        return { success: true, segments };

    } catch (e) {
        const elapsed = Date.now() - startTime;
        console.error(`[InnerTube BG] ❌ === TRANSCRIPT FETCH FAILED ===`);
        console.error(`[InnerTube BG] ❌ Error type:`, e.constructor.name);
        console.error(`[InnerTube BG] ❌ Error message:`, e.message);
        console.error(`[InnerTube BG] ❌ Error stack:`, e.stack);
        console.error(`[InnerTube BG] ❌ Elapsed time:`, elapsed, 'ms');

        if (e.response) {
            console.error(`[InnerTube BG] ❌ HTTP Response:`, {
                status: e.response.status,
                statusText: e.response.statusText,
                url: e.response.url
            });
        }

        return { success: false, error: e.message, stack: e.stack };
    }
}

export async function handleGetVideoInfo(request) {
    try {
        const { videoId } = request;
        console.log(`[InnerTube BG] Fetching video info: ${videoId}`);

        const client = await getClient();
        const info = await client.getInfo(videoId);
        const { basic_info, primary_info } = info;

        const metadata = {
            videoId,
            title: basic_info.title,
            description: basic_info.short_description,
            channel: basic_info.channel?.name,
            channelId: basic_info.channel_id,
            duration: basic_info.duration,
            viewCount: basic_info.view_count,
            publishDate: primary_info?.published?.text || null,
            likes: primary_info?.menu?.top_level_buttons?.[0]?.like_button?.like_count || null,
            category: basic_info.category,
            keywords: basic_info.keywords || [],
            captionsAvailable: !!info.captions
        };

        console.log(`[InnerTube BG] ✅ Metadata fetched: ${metadata.title}`);
        return { success: true, metadata };

    } catch (e) {
        console.error('[InnerTube BG] ❌ Metadata fetch failed:', e);
        return { success: false, error: e.message };
    }
}

export async function handleGetComments(request) {
    const startTime = Date.now();
    try {
        const { videoId, limit = 20 } = request;
        console.log(`[InnerTube BG] 💬 === COMMENTS FETCH START ===`);
        console.log(`[InnerTube BG] 📹 Video ID: ${videoId}`);
        console.log(`[InnerTube BG] 🔢 Limit: ${limit}`);

        // Log request
        diagnostics.logRequest('COMMENTS', videoId, { limit });

        // Run diagnostics on first request
        if (diagnostics.requestLog.length === 1) {
            await diagnostics.runFullDiagnostic();
        }

        // Step 1: Get client
        console.log(`[InnerTube BG] 🔧 Step 1: Getting InnerTube client...`);
        const client = await getClient();
        console.log(`[InnerTube BG] ✅ Client obtained`);

        // Step 2: Get video info
        console.log(`[InnerTube BG] 📊 Step 2: Fetching video info...`);
        const info = await client.getInfo(videoId);
        console.log(`[InnerTube BG] ✅ Video info obtained:`, {
            title: info.basic_info?.title,
            hasComments: !!info.comments_entry_point_header,
            commentsDisabled: info.basic_info?.is_comments_disabled
        });

        if (info.basic_info?.is_comments_disabled) {
            console.warn(`[InnerTube BG] ⚠️ Comments are disabled for this video`);
            return { success: false, error: 'Comments disabled', comments: [] };
        }

        // Step 3: Get comments object
        console.log(`[InnerTube BG] 💬 Step 3: Fetching comments object...`);
        const commentsObj = await info.getComments();
        console.log(`[InnerTube BG] ✅ Comments object obtained:`, {
            hasContents: !!commentsObj?.contents,
            contentsLength: commentsObj?.contents?.length || 0,
            contentsType: Array.isArray(commentsObj?.contents) ? 'array' : typeof commentsObj?.contents,
            firstItemType: commentsObj?.contents?.[0]?.type
        });

        const items = [];

        // Step 4: Parse comment threads
        console.log(`[InnerTube BG] 🔍 Step 4: Parsing comment threads...`);
        let parsedCount = 0;
        let skippedCount = 0;

        for (const thread of commentsObj.contents) {
            if (items.length >= limit) {
                console.log(`[InnerTube BG] 🛑 Limit reached (${limit}), stopping parse`);
                break;
            }

            console.log(`[InnerTube BG] 🔍 Thread ${parsedCount + skippedCount + 1}:`, {
                type: thread.type,
                hasComment: !!thread.comment,
                commentType: thread.comment?.type
            });

            if (thread.type === 'CommentThread' && thread.comment) {
                const comment = thread.comment;
                const parsed = {
                    author: comment.author?.name || 'Unknown',
                    text: comment.content?.text || '',
                    likes: comment.vote_count || 0,
                    published: comment.published?.text || '',
                    isCreator: comment.author?.is_creator || false,
                    replyCount: thread.reply_count || 0
                };

                console.log(`[InnerTube BG] ✅ Parsed comment ${items.length + 1}:`, {
                    author: parsed.author,
                    textLength: parsed.text.length,
                    likes: parsed.likes
                });

                items.push(parsed);
                parsedCount++;
            } else {
                console.log(`[InnerTube BG] ⏭️ Skipped non-comment item`);
                skippedCount++;
            }
        }

        const elapsed = Date.now() - startTime;
        console.log(`[InnerTube BG] ✅ === COMMENTS FETCH COMPLETE ===`);
        console.log(`[InnerTube BG] 📊 Results:`, {
            success: true,
            commentsCount: items.length,
            parsedCount,
            skippedCount,
            elapsedMs: elapsed
        });

        // Log success
        diagnostics.logResponse('COMMENTS', request.videoId, true, {
            commentsCount: items.length,
            elapsedMs: elapsed
        });

        return { success: true, comments: items };

    } catch (e) {
        const elapsed = Date.now() - startTime;
        console.error(`[InnerTube BG] ❌ === COMMENTS FETCH FAILED ===`);
        console.error(`[InnerTube BG] ❌ Error type:`, e.constructor.name);
        console.error(`[InnerTube BG] ❌ Error message:`, e.message);
        console.error(`[InnerTube BG] ❌ Error stack:`, e.stack);
        console.error(`[InnerTube BG] ❌ Elapsed time:`, elapsed, 'ms');

        if (e.response) {
            console.error(`[InnerTube BG] ❌ HTTP Response:`, {
                status: e.response.status,
                statusText: e.response.statusText,
                url: e.response.url
            });
        }

        // Log failure with detailed error info
        diagnostics.logResponse('COMMENTS', request.videoId, false, {
            errorType: e.constructor.name,
            errorMessage: e.message,
            httpStatus: e.response?.status,
            elapsedMs: elapsed
        });

        // If 403, run diagnostic
        if (e.response?.status === 403 || e.message.includes('403')) {
            console.error(`[InnerTube BG] 🚨 403 ERROR DETECTED - Running diagnostic...`);
            const diagnostic = await diagnostics.runFullDiagnostic();
            console.error(`[InnerTube BG] 📋 Diagnostic Results:`, diagnostic);
        }

        return { success: false, error: e.message, stack: e.stack };
    }
}

function formatSegments(raw) {
    if (!raw || !Array.isArray(raw)) return [];
    return raw.map(s => ({
        start: (s.start_ms || s.startMs || 0) / 1000,
        duration: ((s.end_ms || s.endMs || s.start_ms || s.startMs || 0) - (s.start_ms || s.startMs || 0)) / 1000,
        text: s.snippet?.text || s.text || ''
    })).filter(s => s.text);
}
