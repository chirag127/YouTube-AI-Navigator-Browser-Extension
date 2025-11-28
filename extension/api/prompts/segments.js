import { buildContextString } from "./utils.js";

export const segments = (context) => {
    const transcript =
        context.transcript && context.transcript.length > 0
            ? typeof context.transcript === "string"
                ? context.transcript
                : JSON.stringify(context.transcript)
            : "[]";

    return `
    Task: Segment transcript. Return raw JSON array.

    CRITICAL:
    1. MERGE adjacent "Content" segments.
    2. Use SHORT keys.

    Context:
    ${buildContextString(context)}

    Categories:
    - Sponsor
    - Unpaid/Self Promotion
    - Exclusive Access
    - Interaction Reminder (Subscribe)
    - Highlight (Max 1)
    - Intermission/Intro Animation
    - Endcards/Credits
    - Preview/Recap
    - Hook/Greetings
    - Tangents/Jokes
    - Content (MERGE adjacent!)

    JSON Format:
    [{
        "s": number (start sec),
        "e": number (end sec, use ${
            context.metadata?.lengthSeconds || -1
        } if unknown),
        "l": "Category",
        "t": "Title (max 3 words)",
        "d": "Description"
    }]

    Transcript:
    ${transcript}
    `;
};
