import { annotateTranscript } from "./rule-engine.js";

export async function classifyTranscript(context, g) {
    const { transcript, metadata } = context;
    if (!transcript || !transcript.length) return [];

    const annotatedTranscript = annotateTranscript(transcript, metadata);

    // Create a new context with the annotated transcript string
    const annotatedContext = {
        ...context,
        transcript: annotatedTranscript,
    };

    try {
        const e = await g.extractSegments(annotatedContext);

        // Merge adjacent segments with same label
        if (!e || !e.length) return [];

        const merged = [];
        let current = e[0];

        for (let i = 1; i < e.length; i++) {
            const next = e[i];
            // If same label and adjacent (gap < 2s), merge
            if (current.label === next.label && next.start - current.end < 2) {
                current.end = next.end;
                current.description += " " + (next.description || "");
            } else {
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);

        return merged;
    } catch (e) {
        return [];
    }
}
