import { qs as i } from '../../utils/shortcuts/dom.js';
import { pi } from '../../utils/shortcuts/global.js';
export class CommentsSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const c = this.s.get().comments || {};
    this.chk('commentsEnabled', c.enabled ?? true);
    this.set('commentsLimit', c.limit || 20);
    this.chk('includeReplies', c.includeReplies ?? true);
    this.set('commentsSortBy', c.sortBy || 'top');
    this.chk('analyzeSentiment', c.analyzeSentiment ?? true);
    this.chk('filterSpam', c.filterSpam ?? true);
    this.chk('showAuthorBadges', c.showAuthorBadges ?? true);
    this.chk('highlightPinned', c.highlightPinned ?? true);
    this.a.attachToAll({
      commentsEnabled: { path: 'comments.enabled' },
      commentsLimit: { path: 'comments.limit', transform: v => pi(v) },
      includeReplies: { path: 'comments.includeReplies' },
      commentsSortBy: { path: 'comments.sortBy' },
      analyzeSentiment: { path: 'comments.analyzeSentiment' },
      filterSpam: { path: 'comments.filterSpam' },
      showAuthorBadges: { path: 'comments.showAuthorBadges' },
      highlightPinned: { path: 'comments.highlightPinned' },
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
