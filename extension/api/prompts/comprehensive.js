import { buildContextString } from './utils.js';

export const comprehensive = (context, options = {}) => {
  const {
    summaryLength = 'medium',
    maxInsights = 8,
    maxFAQ = 5,
    includeTimestamps = true,
    language = 'en',
  } = options;

  const transcript =
    context.transcript && context.transcript.length > 0
      ? typeof context.transcript === 'string'
        ? context.transcript
        : JSON.stringify(context.transcript)
      : 'No transcript available. Analyze based on Context (Metadata, Lyrics, Comments).';

  const lengthMap = {
    short: '2-3 concise paragraphs',
    medium: '4-6 detailed paragraphs',
    long: '8-12 comprehensive paragraphs',
  };

  return `
Role: Advanced AI video analyst.
Task: Comprehensive video analysis with structured output.

Context:
${buildContextString(context)}

Configuration:
- Summary Length: ${lengthMap[summaryLength] || lengthMap.medium}
- Max Key Insights: ${maxInsights}
- Max FAQ Items: ${maxFAQ}
- Timestamps: ${includeTimestamps ? 'Required' : 'Optional'}
- Output Language: ${language}

Critical Rules:
1. **SponsorBlock Segments = VERIFIED GROUND TRUTH**: Exclude sponsors/self-promo from summary/insights unless analyzing them critically.
2. **Timestamps**: ${includeTimestamps ? 'MANDATORY - Use [MM:SS] format for every major point' : 'Optional'}.
3. **Insights**: Extract ${maxInsights} actionable, specific takeaways (not generic observations).
4. **FAQ**: Generate ${maxFAQ} questions viewers would ask, with precise answers.
5. **Structure**: Follow exact markdown format below.

Output Format (Markdown):
## Summary
${includeTimestamps ? '- [00:00] Opening point\n- [02:15] Key development\n- [05:30] Main argument\n(Continue with timestamp bullets for entire video)' : '(Flowing paragraphs covering entire video)'}

## Key Insights
- [MM:SS] Insight 1: Specific, actionable takeaway
- [MM:SS] Insight 2: Concrete learning point
(${maxInsights} total insights)

## FAQ
**Q: [Specific question viewers would ask]**
A: [Precise answer with timestamp reference]

(${maxFAQ} total Q&A pairs)

Transcript:
${transcript}
`;
};
