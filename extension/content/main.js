(async () => {
    if (window.location.hostname !== "www.youtube.com") {
        return;
    }

    // Inject Main World Extractor
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("content/youtube-extractor.js");
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);

    console.log("YouTube AI Master: Starting...");

    try {
        const { initializeExtension, waitForPageReady } = await import(
            chrome.runtime.getURL("content/core/init.js")
        );
        await waitForPageReady();
        const success = await initializeExtension();

        if (success) {
            console.log("YouTube AI Master: Ready ✓");
        } else {
            console.error("YouTube AI Master: Initialization failed");
        }
    } catch (error) {
        console.error("YouTube AI Master: Fatal error", error);
    }
})();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const action = request.action || request.type;

    switch (action) {
        case "START_ANALYSIS":
            import(chrome.runtime.getURL("content/core/analyzer.js"))
                .then(({ startAnalysis }) => {
                    startAnalysis();
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error("Analysis import failed:", error);
                    sendResponse({ success: false, error: error.message });
                });
            return true;

        case "GET_METADATA":
            handleGetMetadata(request, sendResponse);
            return true;

        case "GET_TRANSCRIPT":
            handleGetTranscript(request, sendResponse);
            return true;

        case "GET_COMMENTS":
            handleGetComments(request, sendResponse);
            return true;

        case "SEEK_TO":
            handleSeekTo(request, sendResponse);
            return true;

        case "SHOW_SEGMENTS":
            handleShowSegments(request, sendResponse);
            return true;

        default:
            return false;
    }
});

async function handleGetMetadata(request, sendResponse) {
    try {
        const { videoId } = request;
        const { MetadataExtractor } = await import(
            chrome.runtime.getURL("content/metadata/extractor.js")
        );
        const metadata = await MetadataExtractor.extract(videoId);

        sendResponse({ success: true, metadata });
    } catch (error) {
        console.error("[Metadata] Error:", error);
        sendResponse({
            success: true,
            metadata: {
                title:
                    document.title.replace(" - YouTube", "") || "YouTube Video",
                author: "Unknown Channel",
                viewCount: "Unknown",
                videoId: request.videoId,
            },
        });
    }
}

async function handleGetTranscript(request, sendResponse) {
    try {
        const { videoId } = request;
        const { getTranscript } = await import(
            chrome.runtime.getURL("content/transcript/service.js")
        );
        const transcript = await getTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            throw new Error("This video does not have captions available");
        }

        sendResponse({ success: true, transcript });
    } catch (error) {
        console.error("Transcript fetch error:", error);
        let errorMsg = error.message;

        if (errorMsg.includes("Transcript is disabled")) {
            errorMsg = "This video does not have captions/subtitles enabled";
        } else if (errorMsg.includes("No transcript found")) {
            errorMsg = "No transcript available for this video";
        }

        sendResponse({ error: errorMsg });
    }
}

async function handleGetComments(request, sendResponse) {
    try {
        const { getComments } = await import(
            chrome.runtime.getURL("content/handlers/comments.js")
        );
        const comments = await getComments();
        sendResponse({ success: true, comments });
    } catch (error) {
        console.error("Comments fetch error:", error);
        sendResponse({ comments: [] });
    }
}

function handleSeekTo(request, sendResponse) {
    try {
        const { timestamp } = request;
        const video = document.querySelector("video");

        if (video) {
            video.currentTime = timestamp;
            sendResponse({ success: true });
        } else {
            throw new Error("Video element not found");
        }
    } catch (error) {
        console.error("Seek error:", error);
        sendResponse({ success: false, error: error.message });
    }
}

async function handleShowSegments(request, sendResponse) {
    try {
        const { segments } = request;
        sendResponse({ success: true });
    } catch (error) {
        console.error("Show segments error:", error);
        sendResponse({ success: false, error: error.message });
    }
}
