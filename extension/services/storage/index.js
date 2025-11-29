import { saveTranscript, getTranscript, deleteTranscript } from './transcript.js';
import { getHistory, updateHistory, deleteFromHistory, searchHistory } from './history.js';
import { videoCache } from './video-cache.js';
import { sl } from '../../utils/shortcuts/storage.js';

export class StorageService {
  constructor() {
    this.storage = sl;
  }
  async saveTranscript(v, m, t, s) {
    const d = await saveTranscript(v, m, t, s);
    await updateHistory(v, m);
    return d;
  }
  async getTranscript(v) {
    return getTranscript(v);
  }
  async getHistory() {
    return getHistory();
  }
  async searchHistory(q) {
    return searchHistory(q);
  }
  async deleteVideo(v) {
    await deleteTranscript(v);
    await deleteFromHistory(v);
    await videoCache.clear(v);
  }
  async saveVideoData(v, d) {
    await updateHistory(v, d.metadata || {});
    if (d.transcript) await videoCache.set(v, 'transcript', d.transcript);
    if (d.metadata) await videoCache.set(v, 'metadata', d.metadata);
    if (d.comments) await videoCache.set(v, 'comments', d.comments);
    if (d.summary) await videoCache.set(v, 'summary', d.summary);
    if (d.segments) await videoCache.set(v, 'segments', d.segments);
  }
  async getVideoData(v) {
    const [t, m, c, s, sg] = await Promise.all([
      videoCache.get(v, 'transcript'),
      videoCache.get(v, 'metadata'),
      videoCache.get(v, 'comments'),
      videoCache.get(v, 'summary'),
      videoCache.get(v, 'segments'),
    ]);
    return { transcript: t, metadata: m, comments: c, summary: s, segments: sg };
  }
  async hasVideoData(v) {
    return !!(await videoCache.get(v, 'metadata'));
  }
  async getCachedTranscript(v) {
    return videoCache.get(v, 'transcript');
  }
  async getCachedSummary(v) {
    return videoCache.get(v, 'summary');
  }
  async getCachedSegments(v) {
    return videoCache.get(v, 'segments');
  }
  async getCachedComments(v) {
    return videoCache.get(v, 'comments');
  }
  async getCachedChat(v) {
    return videoCache.get(v, 'chat');
  }
  async saveTranscriptCache(v, t) {
    return videoCache.set(v, 'transcript', t);
  }
  async saveSummaryCache(v, s, f, i) {
    return videoCache.set(v, 'summary', { s, f, i });
  }
  async saveSegmentsCache(v, s) {
    return videoCache.set(v, 'segments', s);
  }
  async saveCommentsCache(v, c, cs) {
    return videoCache.set(v, 'comments', { c, cs });
  }
  async saveChatMessage(v, r, m) {
    // Chat might need appending, but for now simple set
    return videoCache.set(v, 'chat', { r, m });
  }
  async saveMetadataCache(v, m) {
    return videoCache.set(v, 'metadata', m);
  }
}
