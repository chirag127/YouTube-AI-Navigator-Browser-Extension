import { st } from '../../utils/shortcuts/global.js';
import { raf } from '../../utils/shortcuts/async.js';
import { ce as cr, ap } from '../../utils/shortcuts/dom.js';
export class NotificationManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isShowing = false;
    this.init();
  }
  init() {
    this.container = cr('div');
    this.container.id = 'notification-container';
    this.container.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    ap(document.body, this.container);
  }
  show(m, t = 'success', d = 3000) {
    const n = cr('div');
    n.className = `notification notification-${t}`;
    const i = this.getIcon(t);
    n.innerHTML = `<span class="notification-icon">${i}</span><span class="notification-message">${m}</span>`;
    n.style.cssText = `display:flex;align-items:center;gap:12px;padding:12px 20px;background:${this.getBackground(t)};color:${this.getColor(t)};border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:translateX(400px);transition:transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275);pointer-events:auto;border:1px solid ${this.getBorderColor(t)};`;
    ap(this.container, n);
    raf(() => {
      n.style.transform = 'translateX(0)';
    });
    st(() => {
      n.style.transform = 'translateX(400px)';
      st(() => {
        n.remove();
      }, 300);
    }, d);
    return n;
  }
  getIcon(t) {
    const i = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ', saving: '💾' };
    return i[t] || i.info;
  }
  getBackground(t) {
    const b = {
      success: '#00d26a',
      error: '#ff4444',
      warning: '#ffcc00',
      info: '#3ea6ff',
      saving: '#666',
    };
    return b[t] || b.info;
  }
  getColor(t) {
    const c = { success: '#000', error: '#fff', warning: '#000', info: '#fff', saving: '#fff' };
    return c[t] || c.info;
  }
  getBorderColor(t) {
    const b = {
      success: '#00ff88',
      error: '#ff6666',
      warning: '#ffdd44',
      info: '#5eb8ff',
      saving: '#888',
    };
    return b[t] || b.info;
  }
  success(m) {
    return this.show(m, 'success');
  }
  error(m) {
    return this.show(m, 'error', 5000);
  }
  warning(m) {
    return this.show(m, 'warning', 4000);
  }
  info(m) {
    return this.show(m, 'info');
  }
  saving(m = 'Saving...') {
    return this.show(m, 'saving', 1000);
  }
}
