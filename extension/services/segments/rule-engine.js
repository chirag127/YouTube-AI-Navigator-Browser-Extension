import * as filler from './rules/filler.js';
import * as highlight from './rules/highlight.js';
import * as interaction from './rules/interaction.js';
import * as intro from './rules/intro.js';
import * as preview from './rules/preview.js';
import * as selfPromo from './rules/self-promotion.js';
import * as sponsor from './rules/sponsor.js';

const rules = [filler, highlight, interaction, intro, preview, selfPromo, sponsor];

export function annotateTranscript(transcriptSegments, metadata) {
  const result = transcriptSegments
    .map(segment => {
      const hints = [];
      const context = { segment, metadata };

      for (const rule of rules) {
        try {
          if (rule.detect(segment.text, context)) {
            hints.push(rule.type);
          }
        } catch (err) {
          void err;
        }
      }

      if (hints.length > 0) {
        return `[${segment.start.toFixed(1)}] ${segment.text} [Hint: Possible ${hints.join(', ')}]`;
      }
      return `[${segment.start.toFixed(1)}] ${segment.text}`;
    })
    .join('\n');
  return result;
}
