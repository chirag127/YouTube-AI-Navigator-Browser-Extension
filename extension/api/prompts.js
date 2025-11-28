export const prompts = {
    summary: (transcript, options) => {
        const { metadata, lyrics } = options;
        const title = metadata?.deArrowTitle || metadata?.title || "Unknown Title";
        const contextInfo = `
        Video Title: ${title}
        ${metadata?.deArrowTitle ? "(Community Contributed Title)" : ""}
        Channel: ${metadata?.author || "Unknown"}
        Description: ${metadata?.description || "N/A"}
        ${lyrics ? `\nLyrics Source: ${lyrics.source}\nLyrics:\n${lyrics.lyrics}\n` : ""}
        `;

        return `
        Role: You are an expert video summarizer.
        Task: Create a concise summary of the following video transcript.

        Context:
        ${contextInfo}

        Constraints:
        - Length: ${options.length || "Medium"}
        - Language: ${options.language || "English"}
        - Format: Markdown

        Transcript:
        ${transcript}
        `;
    },

    chat: (question, context, metadata) => {
        const title = metadata?.deArrowTitle || metadata?.title || "Unknown";
        return `
        Role: You are a helpful AI assistant for a YouTube video.
        Context: The user is watching a video titled "${title}".
        ${metadata?.deArrowTitle ? "Note: This is a community-contributed title (DeArrow)." : ""}
        Channel: ${metadata?.author || "Unknown"}

        Video Transcript Context: ${context}

        User Question: ${question}

        Instructions:
        - Answer based ONLY on the video context provided.
        - Be concise and helpful.
        - If the answer is not in the video, state that clearly.
        `;
    },

    comments: (comments) => {
        const commentText = comments
            .map((c) => `- ${c.authorText}: ${c.textDisplay}`)
            .join("\n");
        return `
        Task: Analyze the sentiment and key themes of these YouTube comments.

        Comments:
        ${commentText}

        Output Format (Markdown):
        ### Sentiment Overview
        (Positive/Negative/Neutral mix)

        ### Key Themes
        - Theme 1
        - Theme 2

        ### Controversial Topics (if any)
        `;
    },

    faq: (transcript, metadata) => {
        const title = metadata?.deArrowTitle || metadata?.title || "";
        return `
        Task: Generate 5-7 Frequently Asked Questions (FAQ) that this video answers, along with their concise answers.

        Video Title: ${title}
        ${metadata?.deArrowTitle ? "(Community Contributed Title)" : ""}
        Channel: ${metadata?.author || "Unknown"}

        Transcript:
        ${transcript}

        Format:
        **Q: [Question]**
        A: [Answer]
        `;
    },

    segments: (transcript, metadata) => {
        const title = metadata?.deArrowTitle || metadata?.title || "";
        return `
        Task: Segment the following transcript into logical chapters based on the categories below.
        Return ONLY a raw JSON array. No markdown formatting.

        Context:
        Video Title: ${title}
        ${metadata?.deArrowTitle ? "(Community Contributed Title)" : ""}
        Channel: ${metadata?.author || "Unknown"}
        Description: ${metadata?.description ? metadata.description.substring(0, 500) + "..." : "N/A"}

        Categories (Use EXACTLY these labels):
        - Sponsor: Paid promotion, paid referrals and direct advertisements. Not for self-promotion or free shoutouts to causes/creators/websites/products they like.
        - Unpaid/Self Promotion: Unpaid or self-promotion. This includes sections about merchandise, donations, or information about who they collaborated with.
        - Exclusive Access: Only for labeling entire videos. Used when a video showcases a product, service or location that they've received free or subsidized access to.
        - Interaction Reminder (Subscribe): When there is a short reminder to like, subscribe or follow them in the middle of content. If it is long or about something specific, it should be under self promotion instead.
        - Highlight: The part of the video that most people are looking for. Similar to "Video starts at x" comments.
        - Intermission/Intro Animation: An interval without actual content. Could be a pause, static frame, repeating animation. This should not be used for transitions containing information.
        - Endcards/Credits: Credits or when the YouTube endcards appear. Not for conclusions with information.
        - Preview/Recap: Collection of clips that show what is coming up in in this video or other videos in a series where all information is repeated later in the video.
        - Hook/Greetings: Narrated trailers for the upcoming video, greetings and goodbyes. This should not skip conclusions with information.
        - Tangents/Jokes: Tangential scenes or jokes that are not required to understand the main content of the video. This should not include segments providing context or background details. This is a very aggressive category meant for when you aren't in the mood for "fun".
        - Content: The main video content.

        JSON Format:
        [
            {
                "start": number (seconds),
                "end": number,
                "label": "Category Name",
                "title": "Short descriptive title (max 5 words)",
                "description": "Detailed description of what happens in this segment",
                "importance": "High" | "Medium" | "Low"
            }
        ]

        Transcript:
        ${transcript}
        `;
    },

    comprehensive: (transcript, options) => {
        const { metadata, lyrics } = options;
        const title = metadata?.deArrowTitle || metadata?.title || "Unknown Title";

        const contextInfo = `
        Video Title: ${title}
        ${metadata?.deArrowTitle ? "(Community Contributed Title - Use this for context)" : ""}
        Channel: ${metadata?.author || "Unknown"}
        Description: ${metadata?.description || "N/A"}
        ${lyrics ? `\nLyrics Source: ${lyrics.source}\nLyrics:\n${lyrics.lyrics}\n` : ""}
        `;

        return `
        Role: You are an advanced AI video analyst.
        Task: Provide a comprehensive analysis of this video.

        Context:
        ${contextInfo}

        Directives:
        1. **Summary**: A ${options.length || "Medium"} length summary.
        2. **Key Insights**: Bullet points of the most valuable takeaways.
        3. **Timestamps**: Include [MM:SS] timestamps references where appropriate.
        4. **FAQ**: 3-5 relevant Q&A pairs.

        Format (Markdown):
        ## Summary
        (Text with timestamps like [05:30])

        ## Key Insights
        - Insight 1
        - Insight 2

        ## FAQ
        **Q: ...**
        A: ...

        Transcript:
        ${transcript}
        `;
    },
};

