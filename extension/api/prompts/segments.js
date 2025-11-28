import { buildContextString } from "./utils.js";

export const segments = (context) => {
    const transcript =
        context.transcript && context.transcript.length > 0
            ? typeof context.transcript === "string"
                ? context.transcript
                : JSON.stringify(context.transcript)
            : "[]";

    return `
    Task: Segment transcript with HIGH GRANULARITY. Return raw JSON object.

    ${buildContextString(context)}

    CRITICAL:
    1. SEGMENTATION STRATEGY:
       - First, identify all SPECIAL categories (Sponsor, Self Promotion, Intro, etc.).
       - Then, segment the remaining "Content" by distinct TOPICS.
       - Do NOT output a single "Content" segment for the whole video unless it's very short (under 2 mins).
    2. MERGE adjacent segments ONLY if they are the EXACT SAME category AND cover the same specific topic.
    3. Descriptions MUST be concise summaries. NO raw transcript.
    4. Use SHORT keys (S, SP, UP, IR, etc.) for labels in the JSON.
    4. FULL VIDEO LABEL RULE:
       - Calculate the total duration of the video based on the transcript.
       - If a single category (e.g., Sponsor, Self Promotion, etc.) occupies MORE THAN 50% of the video's total duration:
         - Set "fullVideoLabel" to that category's code (e.g., "S").
         - DO NOT create any segments for that specific category. The "fullVideoLabel" covers it.
         - Only create segments for OTHER categories (e.g., if full video is Sponsor, still mark Intermissions or Self Promotion if they exist).
       - If no category exceeds 50%, set "fullVideoLabel" to null.
    5. SPONSORBLOCK (STRICT PRIORITY):
       - IF Community Segments are provided: They are VERIFIED GROUND TRUTH. Use their EXACT times/categories.
       - IF NOT provided: Analyze transcript to find these categories.
       - Do NOT duplicate existing SponsorBlock segments.
       - Only create NEW segments for parts not covered by SponsorBlock.
       - Include Chapter titles if available.

    Categories(LABEL_CODE):
    - Sponsor(S): Part of a video promoting a product or service not directly related to the creator. The creator will receive payment or compensation in the form of money or free products. If the entire video is about the product or service, use a Full Video Label.
    - Self Promotion(SP): Promoting a product or service that is directly related to the creator themselves. This usually includes merchandise or promotion of monetized platforms.
    - Unpaid Promotion(UP): The creator will not receive any payment in exchange for this promotion. This includes charity drives or free shout outs for products or other people they like.
    - Interaction Reminder(IR): Explicit reminders to like, subscribe or interact with them on any paid or free platform(s) (e.g. click on a video). If about something specific it should be Unpaid/Self Promotion instead. Can be bundled with Self Promotion into Endcards/Credits.
    - Intermission/Intro Animation(I): Segments typically found at the start of a video that include an animation, still frame or clip which are also seen in other videos by the same creator. This can include livestream pauses with no content (looping animations or chat windows) and Copyright/ Fair Use disclaimers. Do not include disclaimers to protect viewers, preparation or cleanup clips. Do not include skits, time-lapses, slow-motion clips (possibly Tangents/Jokes).
    - Endcards/Credits(EC): Typically near or at the end of the video when the credits pop up and/or endcards are shown. This should not be based solely on the YouTube annotations. Interaction Reminder or Self Promotion can be included.
    - Preview/Recap(P): Collection of clips that show what is coming up in in this video or other videos in a series where all information is repeated later in the video. Do not include recap clips that only appear in the video or clips from a recapped video that is not directly linked to the current video.
    - Hook/Greetings(G): Narrated trailers for the upcoming video, greetings and goodbyes. Do not include conclusions with information.
    - Tangents/Jokes(T): Tangents/ Jokes is only for tangential scenes that are not required to understand the main content of the video. This can also include: Timelapses/ B-Roll, Fake Sponsors and slow-motion clips that do not provide any context or are used as replays or B-roll.
    - Music: Non-Music Section(NM): Only to be used on videos which feature music as the primary content. Segments should only include music not present in the official or Spotify music release. Make sure to only include complete silence.
    - Exclusive Access(EA): (Full Video Label Only) When the creator showcases a product, service or location that they've received free or subsidised access to in the video that cannot be completely removed by cuts.
    - Highlight(H)
    - Content(C): The primary content of the video. Use this for sections that do not fit into any other specific category.

    JSON Format:
    {
        "segments": [
            {
            "s": number (start sec),
            "e": number (end sec, use ${
                context.metadata?.lengthSeconds || -1
            } if unknown),
            "l": "LABEL_CODE",
            "t": "Title",
            "d": "Description"
        }],
        "fullVideoLabel": "LABEL_CODE" | null
    }

    Transcript:
    ${transcript}
    `;
};
