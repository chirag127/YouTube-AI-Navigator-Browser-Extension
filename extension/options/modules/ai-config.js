import { ModelManager } from '../../api/gemini.js';
import { gebi as i, on, ap, tc, ih, rc, vl, el as cr } from '../../utils/shortcuts/dom.js';
import { ft, js, jp, isS, inc, fe, mt, rp, tr, sw } from '../../utils/shortcuts/core.js';

export class AIConfig {
  constructor(s, a) {
    this.s = s;
    this.a = a;
    this.mm = null;
  }
  async init() {
    const c = this.s.get().ai || {};
    if (ModelManager && c.apiKey)
      this.mm = new ModelManager(c.apiKey, 'https://generativelanguage.googleapis.com/v1beta');
    this.set('apiKey', c.apiKey || '');
    this.set('customPrompt', c.customPrompt || '');
    if (c.model) this.set('modelSelect', c.model);
    const els = {
      ak: i('apiKey'),
      tak: i('toggleApiKey'),
      ms: i('modelSelect'),
      rm: i('refreshModels'),
      tc: i('testConnection'),
      cp: i('customPrompt'),
    };
    if (els.ak)
      on(els.ak, 'change', async e => {
        const k = tr(vl(e.target));
        await this.a.save('ai.apiKey', k);
        this.mm = new ModelManager(k, 'https://generativelanguage.googleapis.com/v1beta');
        if (k) await this.loadModels(els.ms);
      });
    if (els.tak)
      on(els.tak, 'click', () => {
        els.ak.type = els.ak.type === 'password' ? 'text' : 'password';
      });
    if (els.cp) this.a.attachToInput(els.cp, 'ai.customPrompt');
    if (els.ms)
      on(els.ms, 'change', e => {
        let m = vl(e.target);
        if (sw(m, 'models/')) m = rp(m, 'models/', '');
        this.a.save('ai.model', m);
      });
    if (els.rm) on(els.rm, 'click', () => this.loadModels(els.ms));
    if (els.tc) on(els.tc, 'click', () => this.test());
    if (c.apiKey) await this.loadModels(els.ms);
  }
  async loadModels(sel) {
    if (!sel) return;
    ih(sel, '<option value="" disabled>Loading...</option>');
    sel.disabled = true;
    try {
      if (!this.mm) throw new Error('Set API key first');
      const m = await this.mm.fetch();
      ih(sel, '');
      if (m.length === 0) {
        ih(sel, '<option value="" disabled>No models found</option>');
        return;
      }
      fe(m, x => {
        const n = isS(x) ? rp(x, 'models/', '') : rp(x.name, 'models/', '') || x;
        const o = cr('option');
        o.value = n;
        tc(o, n);
        ap(sel, o);
      });
      const c = this.s.get().ai || {};
      let s = c.model;
      if (s && sw(s, 'models/')) {
        s = rp(s, 'models/', '');
        await this.a.save('ai.model', s);
      }
      if (s && inc(m, s)) sel.value = s;
      else if (m.length > 0) {
        sel.value = m[0];
        await this.a.save('ai.model', m[0]);
      }
    } catch (x) {
      console.error('Failed to fetch models:', x);
      ih(sel, '<option value="" disabled>Failed to load</option>');
      this.a.notifications?.error(`Failed: ${x.message}`);
    } finally {
      sel.disabled = false;
    }
  }
  async test() {
    const btn = i('testConnection'),
      st = i('apiStatus'),
      ms = i('modelSelect'),
      c = this.s.get().ai || {};
    btn.disabled = true;
    tc(btn, 'Testing...');
    st.className = 'status-indicator hidden';
    try {
      if (!c.apiKey) throw new Error('API Key missing');
      let m = vl(ms) || c.model || 'gemini-2.0-flash-exp';
      if (sw(m, 'models/')) m = rp(m, 'models/', '');
      if (
        !inc(m, '-latest') &&
        !mt(m, /-\d{3}$/) &&
        !mt(m, /-\d{2}-\d{4}$/) &&
        !inc(m, 'preview') &&
        !inc(m, 'exp')
      )
        m += '-latest';
      const r = await ft(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${c.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: js({ contents: [{ parts: [{ text: 'Ping' }] }] }),
        }
      );
      if (!r.ok) {
        const err = jp(await r.text());
        throw new Error(err.error?.message || r.statusText);
      }
      tc(st, '✓ Connection Successful!');
      st.className = 'status-indicator success';
      rc(st, 'hidden');
      this.a.notifications?.success('API verified');
    } catch (x) {
      tc(st, `✗ Failed: ${x.message}`);
      st.className = 'status-indicator error';
      rc(st, 'hidden');
      this.a.notifications?.error(`Failed: ${x.message}`);
    } finally {
      btn.disabled = false;
      tc(btn, 'Test Connection');
    }
  }
  set(id, v) {
    const el = i(id);
    if (el) el.value = v;
  }
}
