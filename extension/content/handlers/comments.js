class CommentsExtractor {
    constructor() {
        this.comments = [];
        this.hasIntercepted = false;

        // Listen for comments from Main World
        window.addEventListener("message", (event) => {
            if (event.source !== window) return;
            if (event.data.type === "YT_COMMENTS") {
                this.handleInterceptedComments(event.data.payload);
            }
        });
    }

    handleInterceptedComments(data) {
        try {
            // Parse comments from the intercepted data
            // The structure depends on whether it's initial data or continuation
            // This is a simplified parser based on the reference
            const items =
                data.onResponseReceivedEndpoints?.[1]
                    ?.reloadContinuationItemsCommand?.continuationItems ||
                data.onResponseReceivedEndpoints?.[0]
                    ?.appendContinuationItemsAction?.continuationItems ||
                data.frameworkUpdates?.entityBatchUpdate?.mutations; // Sometimes here for initial load

            if (items) {
                const newComments = [];
                for (const item of items) {
                    if (item.commentThreadRenderer) {
                        const comment =
                            item.commentThreadRenderer.comment.commentRenderer;
                        newComments.push({
                            id: comment.commentId,
                            author: comment.authorText?.simpleText || "Unknown",
                            text:
                                comment.contentText?.runs
                                    ?.map((r) => r.text)
                                    .join("") || "",
                            likes: comment.voteCount?.simpleText || "0",
                            publishedTime:
                                comment.publishedTimeText?.runs?.[0]?.text ||
                                "",
                        });
                    }
                }

                if (newComments.length > 0) {
                    this.comments = [...this.comments, ...newComments];
                    this.hasIntercepted = true;
                    console.log(
                        `[CommentsExtractor] Intercepted ${newComments.length} comments`
                    );
                }
            }
        } catch (e) {
            console.error(
                "[CommentsExtractor] Error parsing intercepted comments:",
                e
            );
        }
    }

    async getComments() {
        // Strategy 1: Intercepted Comments (Passive)
        if (this.hasIntercepted && this.comments.length > 0) {
            console.log("[CommentsExtractor] Using intercepted comments");
            return this.comments;
        }

        // Strategy 2: InnerTube API (Primary - Most reliable)
        try {
            console.log("[CommentsExtractor] Trying InnerTube API...");
            const response = await chrome.runtime.sendMessage({
                action: 'INNERTUBE_GET_COMMENTS',
                videoId: this.getCurrentVideoId(),
                limit: 20
            });

            if (response.success && response.comments?.length > 0) {
                console.log(`[CommentsExtractor] ✅ InnerTube fetched ${response.comments.length} comments`);
                return response.comments;
            }
        } catch (e) {
            console.warn("[CommentsExtractor] InnerTube fetch failed:", e);
        }

        // Strategy 3: DOM Scraping (Fallback)
        console.log("[CommentsExtractor] Falling back to DOM scraping");
        return this.fetchCommentsFromDOM();
    }

    getCurrentVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    async getInitialDataFromMainWorld() {
        return new Promise((resolve) => {
            const listener = (event) => {
                if (event.source !== window) return;
                if (event.data.type === "YT_DATA_RESPONSE") {
                    window.removeEventListener("message", listener);
                    resolve(event.data.payload);
                }
            };
            window.addEventListener("message", listener);
            window.postMessage({ type: "YT_GET_DATA" }, "*");
            setTimeout(() => {
                window.removeEventListener("message", listener);
                resolve(null);
            }, 1000);
        });
    }

    async fetchCommentsFromDOM() {
        return new Promise((r) =>
            setTimeout(() => {
                const c = [],
                    e = document.querySelectorAll(
                        "ytd-comment-thread-renderer"
                    );
                console.log(`[CommentsExtractor] Found ${e.length} comment elements in DOM`);

                for (const el of e) {
                    if (c.length >= 20) break;
                    try {
                        const a = el
                            .querySelector("#author-text")
                            ?.textContent?.trim(),
                            t = el
                                .querySelector("#content-text")
                                ?.textContent?.trim(),
                            l =
                                el
                                    .querySelector("#vote-count-middle")
                                    ?.textContent?.trim() || "0";

                        console.log(`[CommentsExtractor] Parsed comment - Author: ${a}, Text: ${t?.substring(0, 50)}...`);

                        if (a && t) {
                            c.push({ author: a, text: t, likes: l });
                        } else {
                            console.warn('[CommentsExtractor] Skipping comment - missing author or text');
                        }
                    } catch (e) {
                        console.error('[CommentsExtractor] Error parsing comment element:', e);
                    }
                }
                console.log(`[CommentsExtractor] Successfully extracted ${c.length} comments from DOM`);
                r(c);
            }, 1000)
        );
    }

    /**
     * Active Fetching Strategy
     * Fetches comments using the YouTube API with continuation tokens
     */
    async fetchCommentsActive(apiKey, continuationToken, context) {
        try {
            const response = await fetch(
                `https://www.youtube.com/youtubei/v1/next?key=${apiKey}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        context: context,
                        continuation: continuationToken,
                    }),
                }
            );
            const data = await response.json();
            return this.parseComments(data);
        } catch (e) {
            console.error("[CommentsExtractor] Active fetch failed:", e);
            return { comments: [], nextToken: null };
        }
    }

    parseComments(data) {
        const items =
            data.onResponseReceivedEndpoints?.[1]
                ?.reloadContinuationItemsCommand?.continuationItems ||
            data.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction
                ?.continuationItems ||
            data.frameworkUpdates?.entityBatchUpdate?.mutations;

        const comments = [];
        let nextToken = null;

        if (items) {
            for (const item of items) {
                if (item.commentThreadRenderer) {
                    const comment =
                        item.commentThreadRenderer.comment.commentRenderer;
                    comments.push({
                        id: comment.commentId,
                        author: comment.authorText?.simpleText || "Unknown",
                        text:
                            comment.contentText?.runs
                                ?.map((r) => r.text)
                                .join("") || "",
                        likes: comment.voteCount?.simpleText || "0",
                        publishedTime:
                            comment.publishedTimeText?.runs?.[0]?.text || "",
                    });
                } else if (item.continuationItemRenderer) {
                    nextToken =
                        item.continuationItemRenderer.continuationEndpoint
                            .continuationCommand.token;
                }
            }
        }
        return { comments, nextToken };
    }
}

const extractor = new CommentsExtractor();
export const getComments = extractor.getComments.bind(extractor);
