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

${
  hintsEnabled
    ? `PATTERN DETECTION HINTS (Pre-Analyzed via Regex):
${hints || 'No patterns detected - analyze transcript semantically'}

`
    : ''
}TIMING: Transcript = sentence-level. Predict word-level by estimating speaking rate, detecting mid-block transitions ("But first", "Now back to"), proportional allocation. Align with speech pauses. Target: ±${timingTarget}s accuracy.

SPONSORBLOCK CATEGORIES:

sponsor: Paid ads, affiliate links, 3rd party giveaways. Signals: "sponsored by", "use code", "thanks to [brand]". Duration: ${sponsorRange[0]}-${sponsorRange[1]}s. Takes precedence. If >50% video: fullVideoLabel. Leave disclosure intact.

selfpromo: Creator's merch/courses/Patreon, unpaid shout-outs, supporter lists. Signals: "my merch", "link in description", "join my". Turnkey products (RedBubble) = selfpromo.

interaction: Like/subscribe reminders. Signals: "hit the bell", "leave a comment". 5-10s typical. Can merge with selfpromo/outro if inseparable.

intro: No-content intervals at start. Pauses, animations, livestream breaks, legal disclaimers (NOT viewer warnings). Signals: "hey guys", "welcome back". Duration: ${introRange[0]}-${introRange[1]}s. NOT for: time-lapses, B-roll, viewer protection warnings.

outro: Endcards/credits at video end. NOT for conclusions with info. Goodbye needs clear audio+visual cut. Duration: ${outroRange[0]}-${outroRange[1]}s. Sponsor always separate. Bloopers = filler.

preview: Clips of upcoming content where info repeats later. Signals: "coming up", "previously on". NOT for unique clips or added context.

hook: Narrative teasers (often first scene), greetings before info, non-informational goodbyes. Signals: "in this video", "today we're". 5-20s typical. NOT for recaps or narrative-critical moments.

filler: Tangents/jokes not required. Time-lapses, B-roll, fake sponsors, bloopers. Signals: "by the way", "off topic". LOWEST priority. NOT for: useful info, context, viewer warnings. Use sparingly.

music_offtopic: Music videos ONLY. Non-music sections, silence before/after. Match Spotify release. Can overlap categories. NOT for: dialogue over music, original mix silence, musicals. Aggressive - skips ALL warnings.

poi_highlight: Single moment (start=end). Most important part, title/thumbnail reference. ONE per video. Subjective.

exclusive_access: Full label only. Free/subsidized access showcase. If affiliate link: becomes sponsor.

chapter: Navigation markers. NOT for skipping.

content: Primary content. NEVER skipped. Break into ${minSegs}+ topic segments. NO giant segments.

STRATEGY:
1. Identify special categories first (sponsor, selfpromo, interaction, intro, outro, preview, hook, filler)
2. Segment content by topic - ${minSegs}+ segments for ${videoDuration}s video
3. Merge adjacent only if same specific topic
4. If Community Segments provided: use as ground truth (exact times/categories, refine descriptions)
5. If category >50% duration: fullVideoLabel, no segments for it

DESCRIPTIONS: 1-2 sentences. Summarize in your own words. NO raw transcript quotes.

JSON: {"segments":[{"s":num,"e":num,"l":"sponsor|selfpromo|interaction|intro|outro|preview|hook|filler|music_offtopic|poi_highlight|exclusive_access|chapter|content","t":"Title","d":"Description"}],"fullVideoLabel":"sponsor|selfpromo|exclusive_access|null"}

Transcript:
${transcript}`;
};
