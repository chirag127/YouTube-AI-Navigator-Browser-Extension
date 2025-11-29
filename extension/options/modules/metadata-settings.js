import { qs as i } from '../../utils/shortcuts/dom.js';
export class MetadataSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const m = this.s.get().metadata || {};
    [
      'Title',
      'Author',
      'Description',
      'Tags',
      'Category',
      'Views',
      'Likes',
      'Duration',
      'UploadDate',
      'Chapters',
    ].forEach(k => this.chk(`include${k}`, m[`include${k}`] ?? true));
    this.a.attachToAll({
      includeTitle: { path: 'metadata.includeTitle' },
      includeAuthor: { path: 'metadata.includeAuthor' },
      includeDescription: { path: 'metadata.includeDescription' },
      includeTags: { path: 'metadata.includeTags' },
      includeCategory: { path: 'metadata.includeCategory' },
      includeViews: { path: 'metadata.includeViews' },
      includeLikes: { path: 'metadata.includeLikes' },
      includeDuration: { path: 'metadata.includeDuration' },
      includeUploadDate: { path: 'metadata.includeUploadDate' },
      includeChapters: { path: 'metadata.includeChapters' },
    });
  }
  chk(id, v) {
    const el = i(`#${id}`);
    if (el) el.checked = v;
  }
}
