import { ge, on, $$ } from '../utils/shortcuts/dom.js';
import { sg, ss, sls } from '../utils/shortcuts/storage.js';
import { nw as nt, js } from '../utils/shortcuts/core.js';
import { ft } from '../utils/shortcuts/network.js';
import { cht as ctab } from '../utils/shortcuts/chrome.js';
import { rt } from '../utils/shortcuts/runtime.js';
import { to as st, wn as win } from '../utils/shortcuts/global.js';
class OnboardingFlow {
  constructor() {
    this.currentStep = 0;
    this.totalSteps = 4;
    this.settings = {};
    this.init();
  }
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateUI();
  }
  async loadSettings() {
    const r = await sg('config');
    this.settings = r.config || this.getDefaults();
  }
  async saveSettings(p, v) {
    const k = p.split('.'),
      l = k.pop(),
      t = k.reduce((o, key) => {
        o[key] = o[key] || {};
        return o[key];
      }, this.settings);
    t[l] = v;
    await ss('config', this.settings);
  }
  getDefaults() {
    return {
      ai: { GAK: '', model: 'gemini-2.5-flash-lite-preview-09-2025' },
      automation: { autoAnalyze: true },
      segments: { enabled: true },
      ui: { outputLanguage: 'en' },
      _meta: { onboardingCompleted: false, version: '1.0.0', lastUpdated: nt() },
    };
  }
  setupEventListeners() {
    on(ge('nextBtn'), 'click', () => this.nextStep());
    on(ge('backBtn'), 'click', () => this.prevStep());
    const tak = ge('toggleApiKeyBtn'),
      tst = ge('testApiKeyBtn'),
      aki = ge('apiKeyInput'),
      oak = ge('openApiKeyPage'),
      ol = ge('outputLanguage'),
      aa = ge('autoAnalyze'),
      es = ge('enableSegments'),
      os = ge('openSettingsBtn'),
      fb = ge('finishBtn');
    if (tak) on(tak, 'click', this.toggleApiKeyVisibility.bind(this));
    if (tst) on(tst, 'click', this.testApiKey.bind(this));
    if (aki) on(aki, 'input', this.onApiKeyInput.bind(this));
    if (oak) on(oak, 'click', () => ctab({ url: 'https://aistudio.google.com/app/apikey' }));
    if (ol) on(ol, 'change', e => this.saveSettings('ui.outputLanguage', e.target.value));
    if (aa) on(aa, 'change', e => this.saveSettings('automation.autoAnalyze', e.target.checked));
    if (es) on(es, 'change', e => this.saveSettings('segments.enabled', e.target.checked));
    if (os)
      on(os, 'click', () => {
        rt.openOptionsPage();
        win.close();
      });
    if (fb) on(fb, 'click', () => this.completeOnboarding());
  }
  toggleApiKeyVisibility() {
    const i = ge('apiKeyInput');
    i.type = i.type === 'password' ? 'text' : 'password';
  }
  onApiKeyInput() {
    const s = ge('apiKeyStatus');
    s.className = 'status-message';
    s.textContent = '';
  }
  async testApiKey() {
    const i = ge('apiKeyInput'),
      b = ge('testApiKeyBtn'),
      s = ge('apiKeyStatus'),
      k = i.value.trim();
    if (!k) {
      s.className = 'status-message error';
      s.textContent = 'Please enter an API key';
      return;
    }
    b.disabled = true;
    b.textContent = 'Testing...';
    s.className = 'status-message loading';
    s.textContent = 'Connecting to Google AI...';
    try {
      const m = 'gemini-2.5-pro';
      const r = await ft(
        `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: js({ contents: [{ parts: [{ text: 'Hello' }] }] }),
        }
      );
      if (!r.ok) {
        let em = 'Invalid API key or connection failed';
        try {
          const ed = await r.json();
          em = ed.error?.message || em;
        } catch (e) {
          em = `Connection failed(${r.status}: ${r.statusText})`;
        }
        throw new Error(em);
      }
      await this.saveSettings('ai.GAK', k);
      await sls('GAK', k);
      s.className = 'status-message success';
      s.textContent = '✓ Connection successful! API key saved.';
      st(() => this.nextStep(), 1500);
    } catch (e) {
      s.className = 'status-message error';
      s.textContent = `✗ ${e.message}`;
    } finally {
      b.disabled = false;
      b.textContent = 'Test Connection';
    }
  }
  nextStep() {
    if (this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.updateUI();
    }
  }
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateUI();
    }
  }
  updateUI() {
    const s = [...$$('.step')],
      d = [...$$('.step-dot')],
      pf = ge('progressFill'),
      bb = ge('backBtn'),
      nb = ge('nextBtn');
    s.forEach((st, i) => {
      st.classList.remove('active', 'prev');
      if (i === this.currentStep) st.classList.add('active');
      else if (i < this.currentStep) st.classList.add('prev');
    });
    d.forEach((dt, i) => {
      dt.classList.remove('active', 'completed');
      if (i === this.currentStep) dt.classList.add('active');
      else if (i < this.currentStep) dt.classList.add('completed');
    });
    pf.style.width = `${((this.currentStep + 1) / this.totalSteps) * 100}% `;
    bb.disabled = this.currentStep === 0;
    nb.style.display = this.currentStep === this.totalSteps - 1 ? 'none' : 'block';
    this.loadStepData();
  }
  async loadStepData() {
    if (this.currentStep === 1) {
      const i = ge('apiKeyInput');
      if (this.settings.ai?.GAK) i.value = this.settings.ai.GAK;
    } else if (this.currentStep === 2) {
      ge('outputLanguage').value = this.settings.ui?.outputLanguage || 'en';
      ge('autoAnalyze').checked = this.settings.automation?.autoAnalyze || false;
      ge('enableSegments').checked = this.settings.segments?.enabled !== false;
    }
  }
  async completeOnboarding() {
    await this.saveSettings('_meta.onboardingCompleted', true);
    win.close();
  }
}
on(document, 'DOMContentLoaded', () => new OnboardingFlow());
