// Comprehensive video data cache
export async function saveVideoData(vid, data) {
    const key = `video_${vid}`
    const existing = await getVideoData(vid)
    const merged = {
        videoId: vid,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        ...existing,
        ...data
    }
    await chrome.storage.local.set({ [key]: merged })
    return merged
}

export async function getVideoData(vid) {
    const r = await chrome.storage.local.get(`video_${vid}`)
    const data = r[`video_${vid}`]
    if (data) {
        // Update last accessed
        data.lastAccessed = Date.now()
        await chrome.storage.local.set({ [`video_${vid}`]: data })
    }
    return data || null
}

export async function hasVideoData(vid) {
    const data = await getVideoData(vid)
    return !!data
}

export async function deleteVideoData(vid) {
    await chrome.storage.local.remove(`video_${vid}`)
}

// Get specific cached data
export async function getCachedTranscript(vid) {
    const data = await getVideoData(vid)
    return data?.transcript || null
}

export async function getCachedSummary(vid) {
    const data = await getVideoData(vid)
    return data?.summary || null
}

export async function getCachedSegments(vid) {
    const data = await getVideoData(vid)
    return data?.segments || null
}

export async function getCachedComments(vid) {
    const data = await getVideoData(vid)
    return data?.comments || null
}

export async function getCachedChat(vid) {
    const data = await getVideoData(vid)
    return data?.chatHistory || []
}

// Save specific data
export async function saveTranscriptCache(vid, transcript) {
    return saveVideoData(vid, { transcript })
}

export async function saveSummaryCache(vid, summary, faq, insights) {
    return saveVideoData(vid, { summary, faq, insights })
}

export async function saveSegmentsCache(vid, segments) {
    return saveVideoData(vid, { segments })
}

export async function saveCommentsCache(vid, comments, commentSummary) {
    return saveVideoData(vid, { comments, commentSummary })
}

export async function saveChatMessage(vid, role, message) {
    const data = await getVideoData(vid)
    const chatHistory = data?.chatHistory || []
    chatHistory.push({ role, message, timestamp: Date.now() })
    return saveVideoData(vid, { chatHistory })
}

export async function saveMetadataCache(vid, metadata) {
    return saveVideoData(vid, { metadata })
}
