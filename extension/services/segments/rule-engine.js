import * as filler from "./rules/filler.js";
import * as highlight from "./rules/highlight.js";
import * as interaction from "./rules/interaction.js";
import * as intro from "./rules/intro.js";
import * as preview from "./rules/preview.js";
import * as selfPromo from "./rules/self-promotion.js";
import * as unpaidPromo from "./rules/unpaid-promotion.js";
import * as sponsor from "./rules/sponsor.js";

const rules = [
    filler,
    highlight,
    interaction,
    intro,
    preview,
    selfPromo,
    unpaidPromo,
    sponsor,
];

export function annotateTranscript(transcriptSegments, metadata) {
    return transcriptSegments
        .map((segment) => {
            const hints = [];
            const context = { segment, metadata };

            for (const rule of rules) {
                try {
                    if (rule.detect(segment.text, context)) {
                        hints.push(rule.type);
                    }
                } catch (e) {
                    // Ignore rule errors
                }
            }

            if (hints.length > 0) {
                return `[${segment.start.toFixed(1)}] ${segment.text
                    } [Hint: Possible ${hints.join(", ")}]`;
            }
            return `[${segment.start.toFixed(1)}] ${segment.text}`;
        })
        .join("\n");
}
