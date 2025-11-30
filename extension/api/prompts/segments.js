import { buildContextString } from './utils.js';
import { analyzeTranscript, buildPatternHints } from '../../utils/patterns/index.js';
import { sg } from '../../utils/shortcuts/storage.js';
export const segments = async context => {
  const cfg = await sg('config');
  const pCfg = cfg.config?.prompts?.segments || {};
  const role =
    pCfg.roleDescription ||
    'Elite Video Segmentation Specialist with 15+ years analyzing YouTube content structure and SponsorBlock taxonomy';
  const timingTarget = pCfg.timingAccuracyTarget || 2;
  const sponsorRange = pCfg.sponsorDurationRange || [30, 90];
  const introRange = pCfg.introDurationRange || [5, 15];
  const outroRange = pCfg.outroDurationRange || [10, 30];
  const minShort = pCfg.minSegmentsShort || 3;
  const minLong = pCfg.minSegmentsLong || 8;
  const threshold = pCfg.videoLengthThreshold || 600;
  const hintsEnabled = pCfg.enablePatternHints !== false;
  const transcript =
    context.transcript && context.transcript.length > 0
      ? typeof context.transcript === 'string'
        ? context.transcript
        : JSON.stringify(context.transcript)
      : '[]';
  const videoDuration = context.metadata?.lengthSeconds || 0;
  const minSegs = videoDuration > threshold ? minLong : minShort;
  const patternMatches = hintsEnabled ? analyzeTranscript(transcript) : {};
  const hints = hintsEnabled ? buildPatternHints(patternMatches) : '';
  return `Role: ${role}
Task: Generate PRECISE video segments with WORD-LEVEL timing predictions. Return ONLY valid JSON.

${buildContextString(context)}

${hintsEnabled
      ? `PATTERN DETECTION HINTS (Pre-Analyzed via Regex):
${hints || 'No patterns detected - analyze transcript semantically'}

`
      : ''
    }CRITICAL TIMING PREDICTION PROTOCOL:
- Transcript provides SENTENCE-LEVEL timing blocks, NOT word-level
- YOU MUST predict word-level boundaries by:
  * Estimating speaking rate (words/second) within each block
  * Detecting transition phrases mid-block (e.g., "But first", "Now back to")
  * Calculating proportional time allocation for multi-topic blocks
  * Using typical segment durations as calibration (Sponsor: ${sponsorRange[0]}-${sponsorRange[1]}s, Intro: ${introRange[0]}-${introRange[1]}s, Outro: ${outroRange[0]}-${outroRange[1]}s)
- Segment boundaries MUST align with natural speech pauses (sentence endings)
- Accuracy target: ±${timingTarget} seconds of actual topic change

SPONSORBLOCK CATEGORY DEFINITIONS (November 2025 Official Guidelines):

SPONSOR (sponsor) - Paid Promotions & Advertisements:
• Paid advertisement of product/service OR product received for free
• Affiliate links and referral programs
• Giveaways with 3rd party provided items + winner announcements
• Segues into YouTube ads
• Transitions: "This video is sponsored by", "Thanks to [brand]", "Use code", "Brought to you by", "Check out the link"
• Duration: ${sponsorRange[0]}-${sponsorRange[1]}s typical
• ALWAYS takes precedence over all other categories
• If whole video is about sponsor OR >50% duration OR too integrated to remove cleanly: use fullVideoLabel
• Leave disclosure intact (so viewers aware of bias), skip only cleanly removable mentions
• If product has no obvious relation to YouTuber = sponsor
• If product bears company branding as prominently as creator's = sponsor (YouTooz, G-Fuel, GamerSupps)
• Custom/build-to-order products = sponsor
• Biased investment advice (stocks, crypto, NFTs) = sponsor

SELFPROMO (selfpromo) - Unpaid/Self Promotion:
• Merchandise, Patreon, channel memberships, Twitch subscriptions
• Creator's own courses, products, videos, playlists
• Scrolling lists of financial supporters (Patreon, GitHub Sponsors)
• Charities, products, websites they like (unpaid)
• Collaboration credits, shout-outs with no money exchanged
• Giveaways with NO 3rd party (creator purchased items)
• Asking for paid/free services from subscribers (fanmail, video clips)
• Transitions: "My merch", "My course", "Link in description", "Join my Patreon", "Check out my"
• If closely linked with product OR product bears their exclusive branding = selfpromo
• Turnkey/white-label products (RedBubble, TeeSpring) = selfpromo
• Considerable/wholly owned company = selfpromo
• Can include interaction reminders if impossible to separate cleanly

INTERACTION (interaction) - Interaction Reminder (Subscribe):
• Explicit reminders to like, subscribe, comment, follow, bell notifications
• Transitions: "Don't forget to like and subscribe", "Hit the bell", "Leave a comment", "Smash that like button"
• Must be obvious and direct (not subtle mentions)
• Brief reminders only (5-10s typical)
• Can be included in selfpromo/outro if inseparable

INTRO (intro) - Intermission/Intro Animation:
• Intervals without actual content, usually at video start
• Pauses, static frames, looping animations
• Livestream pauses with no content (looping animations, chat window, long breaks)
• Copyright, fair use, fiction, legal disclaimers (NOT viewer protection warnings)
• Topic-themed intro animations, short cinematic openings
• Random unrelated clips with music (TV show-style intros)
• Generic/repetitive chapter title cards with no additional context
• Transitions: "Hey guys", "Welcome back", "What's up"
• Duration: ${introRange[0]}-${introRange[1]}s typical
• NOT for: getting to interesting part (use poi_highlight), time-lapses, slow motion, B-roll, bloopers, jokes
• NOT for: disclaimers protecting viewer (spoiler warnings, content warnings, photosensitive warnings, anti-harassment, content ratings)
• NOT for: context relevant to parts immediately after

OUTRO (outro) - Endcards/Credits:
• Credits or when YouTube endcards appear (typically at video end)
•NOT for conclusions with information
• Financial supporters in credit scroll = outro (alone = selfpromo)
• Goodbye doesn't justify outro unless clear audio AND visual cut
• Include goodbye to avoid jarring cuts (see Daily Dose Of Internet)
• Duration: ${outroRange[0]}-${outroRange[1]}s typical
• Sponsor segments ALWAYS cut separately
• Selfpromo/interaction cut separately if possible, include ONLY if inseparable
• Bloopers = filler (not outro)

PREVIEW (preview) - Preview/Recap:
• Collections of clips showing what's coming in THIS video or future episodes
• All information MUST repeat later in video
• Clips from upcoming content with no added context
• Recaps of past episodes where all info already shown
• Transitions: "Coming up", "Later in this video", "In the next episode", "Previously on"
• NOT for: unique clips only appearing here, additional context not repeated later
• NOT for: teasing next video with voiceover (use selfpromo)

HOOK (hook) - Hook/Greetings:
• Narrative hooks that tease upcoming moments (often first scene)
• Greetings at video start before any information discussed
• Goodbyes/concluding sentences at video end (non-informational only)
• Custom teasers/montages with unique clips repeating upcoming info
• Non-informative descriptions: "We're going to do X and it's crazy"
• Beginning thematic statement/quote already repeated later
• Transitions: "In this video", "Today we're", "Watch what happens", "Hey guys welcome back"
• Duration: 5-20s typical
• NOT for: recaps, additional context not repeated later, moments with narrative importance, compilations from other episodes

FILLER (filler) - Tangents/Jokes:
• Tangential scenes/jokes not required for main narrative
• Time-lapses, B-roll footage
• Fake/joke sponsors (even if real companies)
• Slow motion replays without context
• Bloopers, irrelevant tangents
• Video author distracted by unrelated content
• Unrelated highlight clips with no elaboration
• Transitions: "By the way", "Off topic", "Fun fact", "Speaking of"
• LOWEST priority category - if any other category applies, use that instead
• Most filler should NOT be mute (mute only for chaining to skip)
• NOT for: useful information, context, explanations, analogies, excerpts, background details, referenced segments
• NOT for: viewer protection warnings (spoiler, content, photosensitive, anti-harassment, content ratings)
• Aggressive category - use sparingly

MUSIC_OFFTOPIC (music_offtopic) - Music: Non-Music Section:
• Music videos ONLY - segments not in official audio release
• Talking bits, diegetic audio without music
• Complete silence before/after songs (boost audio to verify)
• Video should resemble Spotify/official release
• Exists independently, can overlap other categories
• NOT for: dialogue over music playing, silent parts in original mix, full musicals/short films
• NOT for: non-music additions over music in background
• Do NOT skip during audio fade-in/out transitions
• May cover any visuals including content warnings
• Aggressive category - skips ALL warnings including flashing lights

POI_HIGHLIGHT (poi_highlight) - Highlight:
• Point of Interest - single moment highlight
• Start time = end time (jumps to specific point)
• Getting to the point/most important part of video
• Part referred to by title or thumbnail
• Part referenced from preview/teaser at start
• Only ONE highlight per video (submit highest priority only)
• NOT for: chapter markers, deliberately skipping entire video
• Subjective category - autoskip NOT recommended

EXCLUSIVE_ACCESS (exclusive_access) - Full Video Label ONLY:
• Showcasing product/service/location with free/subsidized access
• Product under embargo, early press access, exclusive facility access
• Cannot be submitted as regular segment (full video label only)
• If direct affiliate link mentioned = becomes sponsor instead
• Any cleanly skippable parts should still be skipped with sponsor segments

CHAPTER (chapter) - Chapter Markers:
• Chapter markers for navigation
• Structural divisions of content
• NOT for skipping

CONTENT (content) - Primary Video Content:
• Primary video content - educational/entertainment material
• NEVER skipped - default category
• Break into ${minSegs}+ topic-based segments minimum
• Segment by: topic changes, scene changes, subject shifts
• NEVER create one giant content segment
• Merge adjacent content segments ONLY if same specific topic

SEGMENTATION STRATEGY (MANDATORY):
1. Identify SPECIAL categories first (sponsor, selfpromo, interaction, intro, outro, preview, hook, filler)
2. Segment "content" by TOPIC - create ${minSegs}+ segments minimum for this video (${videoDuration}s)
3. MERGE adjacent segments of same category ONLY if same specific topic
4. NEVER create one giant "content" segment - break down by topic changes, scene changes, subject shifts

DESCRIPTION QUALITY RULES:
- Concise summaries (1-2 sentences max)
- FORBIDDEN: Raw transcript quotes or direct text
- REQUIRED: Summarize topic/content in your own words
- Focus on WHAT is discussed, not HOW

COMMUNITY SEGMENTS PRIORITY:
- IF Community Segments (SponsorBlock) provided: Use as PRIMARY REFERENCE (verified ground truth)
- Use their EXACT start/end times and category codes
- May refine descriptions or adjust ±1-2s if transcript adds context
- IF NOT provided: Analyze transcript independently

FULL VIDEO LABEL RULE:
- Calculate total video duration from transcript
- IF single category >50% duration: Set fullVideoLabel to that category, DO NOT create segments for it
- IF NO category >50%: Set fullVideoLabel to null
- Many videos are fully sponsored - use fullVideoLabel: "sponsor"

TIMING CALIBRATION:
- Sponsor mentions: ${sponsorRange[0]}-${sponsorRange[1]}s typical
- Intros: ${introRange[0]}-${introRange[1]}s typical
- Outros/Endcards: ${outroRange[0]}-${outroRange[1]}s typical
- Interaction reminders: 5-10s typical
- Use these to validate predictions

JSON FORMAT (EXACT SponsorBlock API category names):
{
  "segments": [
    {
      "s": number,
      "e": number,
      "l": "sponsor"|"selfpromo"|"interaction"|"intro"|"outro"|"preview"|"hook"|"filler"|"music_offtopic"|"poi_highlight"|"exclusive_access"|"chapter"|"content",
      "t": "Title",
      "d": "Description"
    }
  ],
  "fullVideoLabel": "sponsor"|"selfpromo"|"exclusive_access"|null
}

VALID CATEGORIES: sponsor, selfpromo, interaction, intro, outro, preview, hook, filler, music_offtopic, poi_highlight, exclusive_access, chapter, content

Transcript:
${transcript}`;
};
