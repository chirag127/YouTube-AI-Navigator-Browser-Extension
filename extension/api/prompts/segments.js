import { buildContextString } from "./utils.js";

export const segments = (context) => {
    console.log("Segments Prompt Context:", {
        ...context,
        transcript: "TRANSCRIPT_HIDDEN",
    });
    const transcript =
        context.transcript && context.transcript.length > 0
            ? typeof context.transcript === "string"
                ? context.transcript
                : JSON.stringify(context.transcript)
            : "[]";
    console.log("Segments Transcript Length:", transcript.length);

    return `
    Task: Segment transcript with HIGH GRANULARITY. Return ONLY a valid JSON object with NO additional text, markdown, or explanations.

    ${buildContextString(context)}

    TIMING PREDICTION PROTOCOL (CRITICAL):
    - **TRANSCRIPT TIMING LIMITATION**: The provided transcript contains sentence-level or multi-sentence timing blocks, NOT word-level timing.
    - **YOUR RESPONSIBILITY**: You MUST intelligently predict word-level timing within each transcript block to create accurate segment boundaries.
    - **PREDICTION STRATEGY**:
      * Analyze the text content within each timestamp block
      * Estimate word count and speaking rate
      * Calculate approximate word positions within the time range
      * Identify topic/category transitions that may occur MID-BLOCK (not just at block boundaries)
      * Create segment boundaries at the ESTIMATED word-level timing, even if it falls within a transcript block
    - **EXAMPLE**: If transcript shows [10.0s-20.0s: "Today's video is sponsored by NordVPN. Now let's talk about the main topic..."]
      * You should predict: Sponsor segment ends ~13-14s (after "NordVPN"), Content begins ~14-15s
      * DO NOT wait until 20.0s to change segments just because that's the transcript block boundary
    - **ACCURACY GOAL**: Segment boundaries should be accurate to within ±1-2 seconds of the actual topic/category change

    CRITICAL INSTRUCTIONS:
    1. SEGMENTATION STRATEGY:
       - **Identify SPECIAL categories first** (Sponsor, Self Promotion, Intro, etc.).
       - **Segment "Content" by TOPIC**. Do NOT create one huge "Content" segment.
       - **MANDATORY**: If the video is > 2 minutes, you MUST return at least 3-5 segments minimum.
       - **MANDATORY**: For videos > 10 minutes, you MUST return at least 8-12 segments.
       - **REQUIRED**: Break down content into logical topic changes, scene changes, or subject matter shifts.
       - **TOPIC CONTINUITY**: MERGE adjacent segments of the same category ONLY if they cover the SAME specific topic. Do NOT fragment continuous topics into multiple segments.
    2. **DESCRIPTION QUALITY**:
       - Descriptions MUST be concise summaries (1-2 sentences max)
       - **FORBIDDEN**: Do NOT include raw transcript text or direct quotes
       - **REQUIRED**: Summarize the topic/content in your own words
       - Focus on WHAT is being discussed, not HOW it's being said
    3. **JSON FORMAT**: Use SHORT keys (S, SP, UP, IR, etc.) for labels in the JSON.
    4. **OUTPUT FORMAT**: Return ONLY the JSON object. NO markdown code blocks, NO explanations, NO additional text.
    5. FULL VIDEO LABEL RULE:
       - Calculate the total duration of the video based on the transcript.
       - If a single category (e.g., Sponsor, Self Promotion, etc.) occupies MORE THAN 50% of the video's total duration:
         - Set "fullVideoLabel" to that category's code (e.g., "S")
         - **DO NOT create segments for that specific category** (the fullVideoLabel covers it)
         - **ONLY create segments for OTHER categories** (e.g., if full video is Sponsor, still mark Intermissions or Self Promotion if they exist)
       - If NO category exceeds 50%, set "fullVideoLabel" to null
       - Many videos are completely sponsored by one company - these should use fullVideoLabel: "S"
    6. SPONSORBLOCK REFERENCE (STRICT ADHERENCE):
       - **Community Segments (SponsorBlock) are VERIFIED GROUND TRUTH** - they have been confirmed by multiple users
       - IF Community Segments are provided:
         * Use them as PRIMARY REFERENCE for timing and categories
         * You MUST prioritize them over your own analysis
         * Use their EXACT start/end times and category codes
         * You may refine descriptions or adjust boundaries by ±1-2s if transcript provides additional context
       - IF NOT provided: Analyze transcript independently to identify all categories
       - Include Chapter titles from video description if available

    Categories(LABEL_CODE):
    - Sponsor(S): Part of a video promoting a product or service not directly related to the creator. The creator will receive payment or compensation in the form of money or free products. If the entire video is about the product or service, use a Full Video Label.
    - Self Promotion(SP): Promoting a product or service that is directly related to the creator themselves. This usually includes merchandise or promotion of monetized platforms.
    - Unpaid Promotion(UP): The creator will not receive any payment in exchange for this promotion. This includes charity drives or free shout outs for products or other people they like.
    - Interaction Reminder(IR): Explicit reminders to like, subscribe or interact with them on any paid or free platform(s) (e.g. click on a video). If about something specific it should be Self Promotion or Unpaid Promotion instead. Can be bundled with Self Promotion into Endcards/Credits.
    - Intermission/Intro Animation(I): Segments typically found at the start of a video that include an animation, still frame or clip which are also seen in other videos by the same creator. This can include livestream pauses with no content (looping animations or chat windows) and Copyright/ Fair Use disclaimers. Do not include disclaimers to protect viewers, preparation or cleanup clips. Do not include skits, time-lapses, slow-motion clips (possibly Tangents/Jokes).
    - Endcards/Credits(EC): Typically near or at the end of the video when the credits pop up and/or endcards are shown. This should not be based solely on the YouTube annotations. Interaction Reminder or Self Promotion can be included.
    - Preview/Recap(P): Collection of clips that show what is coming up in in this video or other videos in a series where all information is repeated later in the video. Do not include recap clips that only appear in the video or clips from a recapped video that is not directly linked to the current video.
    - Hook/Greetings(G): Narrated trailers for the upcoming video, greetings and goodbyes. Do not include conclusions with information.
    - Tangents/Jokes(T): Tangents/ Jokes is only for tangential scenes that are not required to understand the main content of the video. This can also include: Timelapses/ B-Roll, Fake Sponsors and slow-motion clips that do not provide any context or are used as replays or B-roll.
    - Music: Non-Music Section(NM): Only to be used on videos which feature music as the primary content. Segments should only include music not present in the official or Spotify music release. Make sure to only include complete silence.
    - Exclusive Access(EA): (Full Video Label Only) When the creator showcases a product, service or location that they've received free or subsidised access to in the video that cannot be completely removed by cuts.
    - Highlight(H)
    - Content(C): The primary content of the video. Use this for sections that do not fit into any other specific category.

    ADVANCED TIMING PREDICTION TECHNIQUES:
    1. **Speaking Rate Analysis**:
       - Count words in transcript blocks and divide by time range to estimate actual speaking rate

    2. **Transition Detection Signals**:
       - Phrases like "Now let's...", "Moving on to...", "But first...", "Speaking of..." indicate topic changes
       - Sponsor transitions: "This video is sponsored by...", "Thanks to [brand] for...", "Now back to..."
       - Self-promotion: "Check out my...", "Link in description...", "My course/merch..."
       - Interaction reminders: "Don't forget to like...", "Subscribe for...", "Hit the bell..."

    3. **Context Clues for Timing**:
       - If a transcript block contains multiple topics, estimate proportional time allocation
       - Sponsor mentions are typically 30-90 seconds (use this to calibrate your predictions)
       - Intros are typically 5-15 seconds, Outros/Endcards 10-30 seconds
       - Use these typical durations to validate your timing predictions

    4. **Boundary Refinement**:
       - Segment boundaries should align with natural speech pauses (typically at sentence endings)
       - Avoid cutting mid-sentence unless absolutely necessary
       - If uncertain between two possible boundaries, choose the one that creates more balanced segment lengths

    JSON Format:
    {
        "segments": [
            {
            "s": number (start sec),
            "e": number (end sec, use ${context.metadata?.lengthSeconds || -1
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
