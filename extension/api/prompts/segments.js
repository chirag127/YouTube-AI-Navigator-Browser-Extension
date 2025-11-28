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
    1. Use SHORT keys.
    2. MERGE adjacent segments of the same category if they cover the same topic. Do NOT fragment continuous topics.
    3. Descriptions MUST be concise summaries (max 15 words). NO raw transcript.

    Context:
    ${buildContextString(context)}

    Categories(LABEL VALUE):
    - Sponsor(S)
    - Unpaid/Self Promotion(USP)
    - Exclusive Access(EA)
    - Interaction Reminder(IR)
    - Highlight(H)
    - Intermission/Intro Animation(I)
    - Endcards/Credits(EC)
    - Preview/Recap(P)
    - Hook/Greetings(G)
    - Tangents/Jokes(T)
    - Content(C)

    JSON Format:
    [{
        "s": number (start sec),
        "e": number (end sec, use ${
            context.metadata?.lengthSeconds || -1
        } if unknown),
        "l": "LABEL VALUE",
        "t": "Title (max 3 words)",
        "d": "Concise Summary (max 15 words)"
    }]

    Transcript:
    ${transcript}
    `;
};
