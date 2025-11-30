import { qs as i } from '../../utils/shortcuts/dom.js';
import { pi } from '../../utils/shortcuts/global.js';
export class TranscriptSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const c = this.s.get().transcript || {};
    this.set('transcriptMethod', c.method || 'auto');
    this.set('transcriptLanguage', c.language || 'en');
    this.chk('includeTimestamps', c.includeTimestamps ?? true);
    this.chk('transcriptAutoTranslate', c.autoTranslate ?? true);
    this.chk('transcriptShowOriginal', c.showOriginal ?? false);
    this.chk('transcriptHighlightKeywords', c.highlightKeywords ?? true);
    this.chk('transcriptAutoClose', c.autoClose ?? true);
    this.set('transcriptAutoCloseDelay', c.autoCloseDelay || 1000);
    this.chk('transcriptAutoCloseOnCached', c.autoCloseOnCached ?? false);
    this.chk('transcriptAutoScroll', c.autoScroll ?? true);
    this.a.attachToAll({
      transcriptMethod: { path: 'transcript.method' },
      transcriptLanguage: { path: 'transcript.language' },
      includeTimestamps: { path: 'transcript.includeTimestamps' },
      transcriptAutoTranslate: { path: 'transcript.autoTranslate' },
      transcriptShowOriginal: { path: 'transcript.showOriginal' },
      transcriptHighlightKeywords: { path: 'transcript.highlightKeywords' },
      transcriptAutoClose: { path: 'transcript.autoClose' },
      transcriptAutoCloseDelay: { path: 'transcript.autoCloseDelay', transform: v => pi(v) },
      transcriptAutoCloseOnCached: { path: 'transcript.autoCloseOnCached' },
      transcriptAutoScroll: { path: 'transcript.autoScroll' },
    });
  }
  set(id, v) {
    const el = i(`#${id}`);
    if (el) el.value = v;
  }
  chk(id, v) {
    const el = i(`#${id}`);
    if (el) el.checked = v;
  }
}
