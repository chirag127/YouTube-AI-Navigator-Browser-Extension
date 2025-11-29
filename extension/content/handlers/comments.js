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
        console.log("[CommentsExtractor] 💬 === STARTING COMMENT EXTRACTION ===");

        // Strategy 1: Intercepted Comments (Passive)
        if (this.hasIntercepted && this.comments.length > 0) {
            console.log("[CommentsExtractor] ✅ Strategy 1: Using intercepted comments", {
                count: this.comments.length
            });
            return this.comments;
        }
        console.log("[CommentsExtractor] ⏭️ Strategy 1: No intercepted comments available");

        // Strategy 2: InnerTube API (Primary - Most reliable)
        try {
            const videoId = this.getCurrentVideoId();
            console.log("[CommentsExtractor] 🔧 Strategy 2: Trying InnerTube API...", {
                videoId,
                limit: 20
            });

            const messagePayload = {
                action: 'INNERTUBE_GET_COMMENTS',
                videoId,
                limit: 20
            };
            console.log("[CommentsExtractor] 📤 Sending message to background:", messagePayload);

            const response = await chrome.runtime.sendMessage(messagePayload);

            console.log("[CommentsExtractor] 📥 Received response from background:", {
                success: response?.success,
                hasComments: !!response?.comments,
                commentsCount: response?.comments?.length || 0,
                error: response?.error,
                fullResponse: response
            });

            if (response.success && response.comments?.length > 0) {
                console.log(`[CommentsExtractor] ✅ Strategy 2: InnerTube fetched ${response.comments.length} comments`);
                return response.comments;
            } else {
                console.warn(`[CommentsExtractor] ⚠️ Strategy 2: InnerTube returned no comments`, {
                    success: response?.success,
                    error: response?.error
                });
            }
        } catch (e) {
            console.error("[CommentsExtractor] ❌ Strategy 2: InnerTube fetch failed:", {
                errorType: e.constructor.name,
                errorMessage: e.message,
                errorStack: e.stack
            });
        }

        // Strategy 3: DOM Scraping (Fallback)
        console.log("[CommentsExtractor] 🔧 Strategy 3: Falling back to DOM scraping");
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
        console.log("[CommentsExtractor] 🔍 Starting DOM scraping...");

        return new Promise((r) =>
            setTimeout(() => {
                const c = [];
                const e = document.querySelectorAll("ytd-comment-thread-renderer");

                console.log(`[CommentsExtractor] 📊 DOM Query Results:`, {
                    selector: "ytd-comment-thread-renderer",
                    elementsFound: e.length,
                    documentReady: document.readyState,
                    commentsSection: !!document.querySelector("ytd-comments"),
                    commentsExpanded: !!document.querySelector("ytd-comments[expanded]")
                });

                if (e.length === 0) {
                    console.warn("[CommentsExtractor] ⚠️ No comment elements found. Possible reasons:", {
                        commentsNotLoaded: "User hasn't scrolled to comments section",
                        commentsDisabled: "Comments may be disabled for this video",
                        selectorChanged: "YouTube may have changed their DOM structure"
                    });
                }

                for (let i = 0; i < e.length; i++) {
                    if (c.length >= 20) {
                        console.log(`[CommentsExtractor] 🛑 Reached limit of 20 comments`);
                        break;
                    }

                    const el = e[i];
                    try {
                        const a = el.querySelector("#author-text")?.textContent?.trim();
                        const t = el.querySelector("#content-text")?.textContent?.trim();
                        const l = el.querySelector("#vote-count-middle")?.textContent?.trim() || "0";

                        console.log(`[CommentsExtractor] 🔍 Comment ${i + 1}/${e.length}:`, {
                            hasAuthor: !!a,
                            hasText: !!t,
                            author: a,
                            textPreview: t?.substring(0, 50) + (t?.length > 50 ? '...' : ''),
                            likes: l
                        });

                        if (a && t) {
                            c.push({ author: a, text: t, likes: l });
                        } else {
                            console.warn(`[CommentsExtractor] ⏭️ Skipping comment ${i + 1} - missing data:`, {
                                hasAuthor: !!a,
                                hasText: !!t
                            });
                        }
                    } catch (err) {
                        console.error(`[CommentsExtractor] ❌ Error parsing comment ${i + 1}:`, {
                            errorType: err.constructor.name,
                            errorMessage: err.message,
                            element: el
                        });
                    }
                }

                console.log(`[CommentsExtractor] ✅ DOM scraping complete:`, {
                    totalElements: e.length,
                    successfullyParsed: c.length,
                    failed: e.length - c.length
                });

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
