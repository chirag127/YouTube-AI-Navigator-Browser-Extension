export const comments = (comments) => {
    const text = comments.map((c) => `- ${c.author}: ${c.text}`).join("\n");
    return `
    Task: Analyze the sentiment and key themes of these YouTube comments.

    Comments:
    ${text}

    Output Format (Markdown):
    ### Sentiment Overview
    (Positive/Negative/Neutral mix)

    ### Key Themes
    - Theme 1
    - Theme 2

    ### Controversial Topics (if any)
    `;
};
