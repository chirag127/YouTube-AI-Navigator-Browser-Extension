import { buildContextString } from "./utils.js";

export const segments = (context) => {
    const transcript =
        context.transcript && context.transcript.length > 0
            ? typeof context.transcript === "string"
                ? context.transcript
                : JSON.stringify(context.transcript)
            : "[]"; // Return empty array if no transcript

    return `
    Task: Segment the following transcript into logical chapters based on the categories below.
    Return ONLY a raw JSON array. No markdown formatting.

    CRITICAL INSTRUCTION: You MUST generate at least one segment labeled "Content".
    - If specific segments are found, the "Content" segment should cover the main body of the video.
    - If NO specific segments are found (or transcript is missing), generate a SINGLE "Content" segment covering the entire video duration.

    Context:
    ${buildContextString(context)}

    Categories (Use EXACTLY these labels):
    - Sponsor: Paid promotion, paid referrals and direct advertisements.
    - Unpaid/Self Promotion: Unpaid or self-promotion.
    - Exclusive Access: Only for labeling entire videos.
    - Interaction Reminder (Subscribe): Short reminder to like/subscribe.
    - Highlight: The SINGLE best part of the video (Max 1 segment).
    - Intermission/Intro Animation: Interval without actual content.
    - Endcards/Credits: Credits or endcards.
    - Preview/Recap: Clips showing what is coming up or repeated info.
    - Hook/Greetings: Narrated trailers, greetings, goodbyes.
    - Tangents/Jokes: Tangential scenes or jokes not required for main content.
    - Content: The main video content (MANDATORY).

    JSON Format:
    [
        {
            "start": number (seconds, MUST be a number),
            "end": number (seconds, MUST be a number, use ${
                context.metadata?.lengthSeconds || -1
            } if unknown),
            "label": "Category Name",
            "title": "Short descriptive title (max 5 words)",
            "description": "Detailed description of what happens in this segment",
            "importance": "High" | "Medium" | "Low"
        }
    ]

    Transcript:
    ${transcript}
    `;
};
