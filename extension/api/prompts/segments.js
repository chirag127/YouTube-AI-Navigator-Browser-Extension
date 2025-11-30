import { buildContextString } from './utils.js';

export const segments = context => {
  const transcript =
    context.transcript && context.transcript.length > 0
      ? typeof context.transcript === 'string'
        ? context.transcript
        : JSON.stringify(context.transcript)
      : '[]';

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
    3. **JSON FORMAT**: Use EXACT SponsorBlock API category names (sponsor, selfpromo, interaction, intro, outro, preview, hook, filler, music_offtopic, poi_highlight, exclusive_access, chapter, content) for the "l" field.
    4. **OUTPUT FORMAT**: Return ONLY the JSON object. NO markdown code blocks, NO explanations, NO additional text.
    5. FULL VIDEO LABEL RULE:
       - Calculate the total duration of the video based on the transcript.
       - If a single category occupies MORE THAN 50% of the video's total duration:
         - Set "fullVideoLabel" to that category's EXACT API name (e.g., "sponsor", "exclusive_access")
         - **DO NOT create segments for that specific category** (the fullVideoLabel covers it)
         - **ONLY create segments for OTHER categories** (e.g., if full video is sponsor, still mark intro or selfpromo)
       - If NO category exceeds 50%, set "fullVideoLabel" to null
       - Many videos are completely sponsored - these should use fullVideoLabel: "sponsor"
    6. SPONSORBLOCK REFERENCE (STRICT ADHERENCE):
       - **Community Segments (SponsorBlock) are VERIFIED GROUND TRUTH** - they have been confirmed by multiple users
       - IF Community Segments are provided:
         * Use them as PRIMARY REFERENCE for timing and categories
         * You MUST prioritize them over your own analysis
         * Use their EXACT start/end times and category codes
         * You may refine descriptions or adjust boundaries by ±1-2s if transcript provides additional context
       - IF NOT provided: Analyze transcript independently to identify all categories
       - Include Chapter titles from video description if available

    SPONSORBLOCK API CATEGORIES (USE EXACT LOWERCASE NAMES):
    - **sponsor**: Paid promotion of product/service not directly related to creator. If entire video is sponsored, use fullVideoLabel.
    - **selfpromo**: Creator's own products, merchandise, monetized platforms, charity drives, unpaid shout-outs.
    - **interaction**: Explicit reminders to like, subscribe, follow, or interact. If about something specific, use selfpromo.
    - **intro**: Intro animations, still frames, clips seen in other videos. Includes livestream pauses, copyright disclaimers.
    - **outro**: Endcards/credits near video end. Can include interaction or selfpromo.
    - **preview**: Clips showing what's coming up where information is repeated later. Do NOT include unique recaps.
    - **hook**: Narrated trailers, greetings, goodbyes. Do NOT include conclusions with new information.
    - **filler**: Tangential scenes not required for understanding. Includes time-lapses, B-roll, fake sponsors, slow-motion replays.
    - **music_offtopic**: (Music videos only) Non-music sections not in official release. Only complete silence or off-topic.
    - **poi_highlight**: (Point of Interest) Specific highlight moment where start = end time.
    - **exclusive_access**: (Full Video Label Only) Showcasing product/service/location with free/subsidized access.
    - **chapter**: Chapter markers for navigation.
    - **content**: Primary video content not fitting other categories.

    CATEGORY DETECTION KEYWORDS:
    - **sponsor**: "sponsored by", "thanks to [brand]", "partnered with", "brought to you by"
    - **selfpromo**: "my course", "my merch", "check out my", "link in description", "my patreon"
    - **interaction**: "like and subscribe", "hit the bell", "leave a comment", "smash that like"
    - **intro**: Opening animations, channel branding, "hey guys", "welcome back"
    - **outro**: "that's it for today", "see you next time", end screens, credits
    - **hook**: "in today's video", "coming up", opening teasers before intro

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

    JSON Format (CRITICAL - Use EXACT SponsorBlock API category names):
    {
        "segments": [
            {
            "s": number (start sec),
            "e": number (end sec, use ${context.metadata?.lengthSeconds || -1} if unknown),
            "l": "sponsor" | "selfpromo" | "interaction" | "intro" | "outro" | "preview" | "hook" | "filler" | "music_offtopic" | "poi_highlight" | "exclusive_access" | "chapter" | "content",
            "t": "Title",
            "d": "Description"
        }],
        "fullVideoLabel": "sponsor" | "selfpromo" | "exclusive_access" | null
    }

    VALID CATEGORY VALUES (copy exactly): sponsor, selfpromo, interaction, intro, outro, preview, hook, filler, music_offtopic, poi_highlight, exclusive_access, chapter, content

    Transcript:
    ${transcript}
    `;
};
