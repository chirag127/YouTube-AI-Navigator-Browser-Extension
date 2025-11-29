import { ModelManager } from '../../api/gemini.js';
import {
  qs as i,
  on,
  ap,
  txc as tc,
  ih,
  rc,
  v as vl,
  ce as cr,
} from '../../utils/shortcuts/dom.js';
import { isS, jp, js, sw } from '../../utils/shortcuts/core.js';
import { inc, rp, trm } from '../../utils/shortcuts/string.js';
import { afe } from '../../utils/shortcuts/array.js';
import { ft } from '../../utils/shortcuts/network.js';
import { l, e } from '../../utils/shortcuts/log.js';
import { sls } from '../../utils/shortcuts/storage.js';
export class AIConfig {
  constructor(s, a) {
    l('AIConfig:Constructor');
    this.s = s;
    this.a = a;
    this.mm = null;
    l('AIConfig:Constructor:Done');
  }
  async init() {
    l('AIConfig:Init');
    try {
      const c = this.s.get().ai || {};
      if (ModelManager && c.GAK)
        this.mm = new ModelManager(c.GAK, 'https://generativelanguage.googleapis.com/v1beta');
      this.set('apiKey', c.GAK || '');
      this.set('customPrompt', c.customPrompt || '');
      if (c.model) this.set('modelSelect', c.model);
      const els = {
        ak: i('#apiKey'),
        tak: i('#toggleApiKey'),
        ms: i('#modelSelect'),
        rm: i('#refreshModels'),
        tc: i('#testConnection'),
        cp: i('#customPrompt'),
      };
      if (els.ak)
        on(els.ak, 'change', async e => {
          const k = trm(vl(e.target));
          await sls('GAK', k);
          await this.a.save('ai.GAK', k);
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
      l('AIConfig:Init:Done');
    } catch (err) {
      e('Err:AIConfig:Init', err);
    }
  }
  async loadModels(sel) {
    l('AIConfig:LoadModels');
    if (!sel) {
      l('AIConfig:LoadModels:Done');
      return;
    }
    ih(sel, '<option value="" disabled>Loading...</option>');
    sel.disabled = true;
    try {
      if (!this.mm) throw new Error('Set API key first');
      const m = await this.mm.fetch();
      ih(sel, '');
      if (m.length === 0) {
        ih(sel, '<option value="" disabled>No models found</option>');
        l('AIConfig:LoadModels:Done');
        return;
      }
      afe(m, x => {
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
      l('AIConfig:LoadModels:Done');
    } catch (x) {
      e('Err:LoadModels', x);
      ih(sel, '<option value="" disabled>Failed to load</option>');
      this.a.notifications?.error(`Failed: ${x.message}`);
    } finally {
      sel.disabled = false;
    }
  }
  async test() {
    l('AIConfig:Test');
    const btn = i('#testConnection'),
      st = i('#apiStatus'),
      ms = i('#modelSelect'),
      c = this.s.get().ai || {};
    btn.disabled = true;
    tc(btn, 'Testing...');
    st.className = 'status-indicator hidden';
    try {
      if (!c.GAK) throw new Error('API Key missing');
      let m = vl(ms) || c.model || 'gemini-2.0-flash-exp';
      if (sw(m, 'models/')) m = rp(m, 'models/', '');
      if (
        !inc(m, '-latest') &&
        !m.match(/-\d{3}$/) &&
        !m.match(/-\d{2}-\d{4}$/) &&
        !inc(m, 'preview') &&
        !inc(m, 'exp')
      )
        m += '-latest';
      const r = await ft(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${c.GAK}`,
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
      l('AIConfig:Test:Done');
    } catch (x) {
      e('Err:Test', x);
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
    l('AIConfig:Set');
    const el = i(`#${id}`);
    if (el) el.value = v;
    l('AIConfig:Set:Done');
  }
}
