import { chunkText } from './text.js';
import { chunkSegments } from './segments.js';
import { l } from '../../utils/shortcuts/logging.js';
export class ChunkingService {
  constructor() {
    l('ENTRY:ChunkingService.constructor');
    this.defaultChunkSize = 500000;
    this.defaultOverlap = 1000;
    l('EXIT:ChunkingService.constructor');
  }
  chunkText(t, s, o) {
    l('ENTRY:ChunkingService.chunkText');
    const result = chunkText(t, s || this.defaultChunkSize, o || this.defaultOverlap);
    l('EXIT:ChunkingService.chunkText');
    return result;
  }
  chunkSegments(segs, s) {
    l('ENTRY:ChunkingService.chunkSegments');
    const result = chunkSegments(segs, s || this.defaultChunkSize);
    l('EXIT:ChunkingService.chunkSegments');
    return result;
  }
}
