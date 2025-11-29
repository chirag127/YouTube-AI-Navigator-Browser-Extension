// InnerTube Background Handler
// Loads YouTube.js in background context and handles requests from content scripts

import { Innertube } from '../../lib/youtubei.js';

let innertubeInstance = null;

async function getClient() {
    if (innertubeInstance) return innertubeInstance;

    console.log('[InnerTube BG] Initializing YouTube.js client...');
    innertubeInstance = await Innertube.create({
        fetch: (input, init) => fetch(input, init)
    });
    console.log('[InnerTube BG] ✅ Client initialized');
    return innertubeInstance;
}

export async function handleGetTranscript(request) {
    try {
        const { videoId, lang = 'en' } = request;
        console.log(`[InnerTube BG] Fetching transcript: ${videoId} (${lang})`);

        const client = await getClient();
        const info = await client.getInfo(videoId);

        if (!info.captions) {
            throw new Error('No captions available');
        }

        const transcriptInfo = await info.getTranscript();

        let segments;
        if (lang !== 'en' && transcriptInfo.languages?.includes(lang)) {
            const localized = await transcriptInfo.selectLanguage(lang);
            segments = formatSegments(
                localized.transcript?.content?.body?.initial_segments ||
                localized.transcript?.content?.initial_segments || []
            );
        } else {
            segments = formatSegments(
                transcriptInfo.transcript?.content?.body?.initial_segments ||
                transcriptInfo.transcript?.content?.initial_segments || []
            );
        }

        console.log(`[InnerTube BG] ✅ ${segments.length} segments fetched`);
        return { success: true, segments };

    } catch (e) {
        console.error('[InnerTube BG] ❌ Transcript fetch failed:', e);
        return { success: false, error: e.message };
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
    try {
        const { videoId, limit = 20 } = request;
        console.log(`[InnerTube BG] Fetching comments: ${videoId} (limit: ${limit})`);

        const client = await getClient();
        const comments = await client.getComments(videoId);
        const items = [];

        for await (const comment of comments) {
            if (items.length >= limit) break;

            // Debug: Log the first comment structure
            if (items.length === 0) {
                console.log('[InnerTube BG] Comment structure:', JSON.stringify(comment, null, 2));
            }

            // YouTube.js comment structure uses .text property directly
            items.push({
                author: comment.author?.name || 'Unknown',
                text: comment.text || comment.content?.text || '',
                likes: comment.vote_count || 0,
                published: comment.published?.text || '',
                isCreator: comment.author?.is_creator || false,
                replyCount: comment.reply_count || 0
            });
        }

        console.log(`[InnerTube BG] ✅ ${items.length} comments fetched`);
        return { success: true, comments: items };

    } catch (e) {
        console.error('[InnerTube BG] ❌ Comments fetch failed:', e);
        return { success: false, error: e.message };
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
