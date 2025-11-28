export const buildContextString = ({
    metadata,
    lyrics,
    comments,
    sponsorBlockSegments,
    externalContext,
}) => {
    let title = `Original Title: ${
        metadata?.originalTitle || metadata?.title || "Unknown"
    }`;
    if (metadata?.deArrowTitle)
        title += `\nCommunity Title (DeArrow): ${metadata.deArrowTitle}`;

    let commentsCtx = "";
    if (comments?.length) {
        commentsCtx =
            "\nTop Comments:\n" +
            comments
                .slice(0, 10)
                .map((c) => `- ${c.author}: ${c.text} (Likes: ${c.likes})`)
                .join("\n");
    }

    let sponsorBlockCtx = "";
    if (sponsorBlockSegments?.length) {
        const formatTime = (s) => {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m}:${sec.toString().padStart(2, "0")}`;
        };

        sponsorBlockCtx =
            "\n\nCommunity Segments (SponsorBlock - VERIFIED GROUND TRUTH):\n" +
            sponsorBlockSegments
                .map((seg) => {
                    const desc = seg.description
                        ? ` - "${seg.description}"`
                        : "";
                    return `- [${seg.category}] ${formatTime(
                        seg.start
                    )} - ${formatTime(seg.end)}${desc} (${seg.votes} votes${
                        seg.locked ? ", locked" : ""
                    })`;
                })
                .join("\n");
    }

    let externalCtx = "";
    if (externalContext && Object.keys(externalContext).length > 0) {
        externalCtx = "\n\n[External Context (Verified Data Sources)]:\n";
        for (const [source, data] of Object.entries(externalContext)) {
            externalCtx += `\nSource: ${source.toUpperCase()}\nData: ${JSON.stringify(
                data,
                null,
                2
            )}\n`;
        }
    }

    return `
    Video Context:
    ${title}
    Channel: ${metadata?.author || "Unknown"}
    Description: ${
        metadata?.description
            ? metadata.description.substring(0, 1000) + "..."
            : "N/A"
    }
    ${
        lyrics
            ? `\nLyrics Source: ${lyrics.source}\nLyrics:\n${lyrics.lyrics}\n`
            : ""
    }
    ${commentsCtx}
    ${sponsorBlockCtx}
    ${externalCtx}
    `;
};
