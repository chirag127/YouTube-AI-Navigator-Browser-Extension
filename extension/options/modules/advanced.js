import { qs as i, on, ce } from '../../utils/shortcuts/dom.js';
import { jp, js } from '../../utils/shortcuts/core.js';
import { e as err } from '../../utils/shortcuts/log.js';
import { to } from '../../utils/shortcuts/global.js';
export class AdvancedSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    this.chk('debugMode', this.s.get().advanced?.debugMode ?? false);
    this.a.attachToAll({ debugMode: { path: 'advanced.debugMode' } });
    const els = {
      ex: i('#exportSettings'),
      im: i('#importSettings'),
      if: i('#importFile'),
      rd: i('#resetDefaults'),
    };
    if (els.ex)
      on(els.ex, 'click', () => {
        const d = js(this.s.get(), null, 2);
        const b = new Blob([d], { type: 'application/json' });
        const u = URL.createObjectURL(b);
        const a = ce('a');
        a.href = u;
        a.download = 'youtube-ai-master-settings.json';
        a.click();
      });
    if (els.im) on(els.im, 'click', () => els.if?.click());
    if (els.if)
      on(els.if, 'change', e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = async ev => {
          try {
            const i = jp(ev.target.result);
            if (await this.s.import(js(i))) {
              this.a.notifications?.success('Settings imported');
              to(() => window.location.reload(), 1000);
            } else throw new Error('Import failed');
          } catch (x) {
            err('Import failed:', x);
            this.a.notifications?.error('Invalid settings file');
          }
        };
        r.readAsText(f);
      });
    if (els.rd)
      on(els.rd, 'click', async () => {
        if (confirm('Reset all settings to default? This cannot be undone.')) {
          await this.s.reset();
          this.a.notifications?.success('Settings reset');
          to(() => window.location.reload(), 1000);
        }
      });
  }
  chk(id, v) {
    const el = i(`#${id}`);
    if (el) el.checked = v;
  }
}
