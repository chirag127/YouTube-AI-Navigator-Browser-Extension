import { buildContextString } from "./utils.js";

export const faq = (transcript, metadata) => {
    const context = {
        transcript,
        metadata,
        comments: [],
        lyrics: null,
        sponsorBlockSegments: [],
    };

    return `
    Task: Generate 5-7 Frequently Asked Questions (FAQ) that this video answers, along with their concise answers.

    ${buildContextString(context)}

    Transcript:
    ${transcript}
    `;
};
