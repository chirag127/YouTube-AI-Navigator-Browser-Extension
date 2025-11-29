import { annotateTranscript } from './rule-engine.js';
import { isa } from '../../utils/shortcuts/array.js';
import { l, e } from '../../utils/shortcuts/logging.js';

export async function classifyTranscript(context, g) {
  l('ENTRY:classifyTranscript');
  const { transcript, metadata } = context;
  if (!transcript || !transcript.length) {
    l('EXIT:classifyTranscript');
    return [];
  }

  const annotatedTranscript = annotateTranscript(transcript, metadata);

  const annotatedContext = {
    ...context,
    transcript: annotatedTranscript,
  };

  try {
    const result = await g.extractSegments(annotatedContext);

    if (isa(result)) {
      l('EXIT:classifyTranscript');
      return { segments: result, fullVideoLabel: null };
    }

    l('EXIT:classifyTranscript');
    return {
      segments: result.segments || [],
      fullVideoLabel: result.fullVideoLabel || null,
    };
  } catch (err) {
    e('error:classifyTranscript', err);
    l('EXIT:classifyTranscript');
    return { segments: [], fullVideoLabel: null };
  }
}
