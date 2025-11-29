import { annotateTranscript } from './rule-engine.js';
import { isa } from '../../utils/shortcuts/array.js';

export async function classifyTranscript(context, g) {
  const { transcript, metadata } = context;
  if (!transcript || !transcript.length) return [];

  const annotatedTranscript = annotateTranscript(transcript, metadata);

  const annotatedContext = {
    ...context,
    transcript: annotatedTranscript,
  };

  try {
    const result = await g.extractSegments(annotatedContext);

    if (isa(result)) {
      return { segments: result, fullVideoLabel: null };
    }

    return {
      segments: result.segments || [],
      fullVideoLabel: result.fullVideoLabel || null,
    };
  } catch (e) {
    return { segments: [], fullVideoLabel: null };
  }
}
