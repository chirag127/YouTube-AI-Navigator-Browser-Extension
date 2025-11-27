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
        // If we have intercepted comments, return them
        if (this.hasIntercepted && this.comments.length > 0) {
            return this.comments;
        }

        // Fallback to DOM scraping
        return this.fetchCommentsFromDOM();
    }

    async fetchCommentsFromDOM() {
        return new Promise((r) =>
            setTimeout(() => {
                const c = [],
                    e = document.querySelectorAll(
                        "ytd-comment-thread-renderer"
                    );
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
                        if (a && t) c.push({ author: a, text: t, likes: l });
                    } catch (e) {}
                }
                r(c);
            }, 1000)
        );
    }
}

const extractor = new CommentsExtractor();
export const getComments = extractor.getComments.bind(extractor);
