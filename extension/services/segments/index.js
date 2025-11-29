import { classifyTranscript } from './classifier.js';
import { fillContentGaps } from './gaps.js';
import { l } from '../../utils/shortcuts/logging.js';
export class SegmentClassificationService {
  constructor(g, c) {
    l('ENTRY:SegmentClassificationService.constructor');
    this.gemini = g;
    this.chunking = c;
    l('EXIT:SegmentClassificationService.constructor');
  }
  async classifyTranscript(context) {
    l('ENTRY:SegmentClassificationService.classifyTranscript');
    const result = await classifyTranscript(context, this.gemini);
    const filledSegments = fillContentGaps(result.segments, context.transcript);

    l('EXIT:SegmentClassificationService.classifyTranscript');
    return {
      segments: filledSegments,
      fullVideoLabel: result.fullVideoLabel,
    };
  }
}
