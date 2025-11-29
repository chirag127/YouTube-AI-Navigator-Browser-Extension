import { qs as i } from '../../utils/shortcuts/dom.js';
import { pi } from '../../utils/shortcuts/global.js';
export class NotificationsSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const n = this.s.get().notifications || {};
    this.chk('notificationsEnabled', n.enabled ?? true);
    this.set('notificationPosition', n.position || 'top-right');
    this.set('notificationDuration', n.duration || 3000);
    this.chk('notificationSound', n.sound ?? false);
    this.chk('notifyOnSave', n.showOnSave ?? true);
    this.chk('notifyOnError', n.showOnError ?? true);
    this.chk('notifyOnProgress', n.showProgress ?? true);
    this.chk('notifyOnComplete', n.showOnComplete ?? true);
    this.chk('notifyOnSegmentSkip', n.showOnSegmentSkip ?? true);
    this.a.attachToAll({
      notificationsEnabled: { path: 'notifications.enabled' },
      notificationPosition: { path: 'notifications.position' },
      notificationDuration: { path: 'notifications.duration', transform: v => pi(v) },
      notificationSound: { path: 'notifications.sound' },
      notifyOnSave: { path: 'notifications.showOnSave' },
      notifyOnError: { path: 'notifications.showOnError' },
      notifyOnProgress: { path: 'notifications.showProgress' },
      notifyOnComplete: { path: 'notifications.showOnComplete' },
      notifyOnSegmentSkip: { path: 'notifications.showOnSegmentSkip' },
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
