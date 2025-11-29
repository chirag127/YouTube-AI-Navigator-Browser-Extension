import { id as i, on, ce, $$ } from '../../utils/shortcuts/dom.js';
import { slr as lr } from '../../utils/shortcuts/storage.js';
import { cf } from '../../utils/shortcuts/platform_api.js';

export class GeneralSettings {
  constructor(s, a) {
    this.s = s;
    this.a = a;
    this.dragSrc = null;
  }
  init() {
    const c = this.s.get();
    this.set('outputLanguage', c.ai?.outputLanguage || 'en');
    this.chk('autoAnalyze', c.automation?.autoAnalyze ?? true);
    this.chk('autoSummarize', c.automation?.autoSummarize ?? true);
    this.chk('autoExtractKeyPoints', c.automation?.autoExtractKeyPoints ?? true);
    this.chk('autoDetectLanguage', c.automation?.autoDetectLanguage ?? true);
    this.chk('autoLoadTranscript', c.automation?.autoLoadTranscript ?? true);
    this.chk('saveHistory', c.advanced?.saveHistory ?? true);

    this.renderStrategies(c.transcript?.strategyOrder || ['dom-automation', 'genius', 'speech-to-text']);

    this.a.attachToAll({
      outputLanguage: { path: 'ai.outputLanguage' },
      autoAnalyze: { path: 'automation.autoAnalyze' },
      autoSummarize: { path: 'automation.autoSummarize' },
      autoExtractKeyPoints: { path: 'automation.autoExtractKeyPoints' },
      autoDetectLanguage: { path: 'automation.autoDetectLanguage' },
      autoLoadTranscript: { path: 'automation.autoLoadTranscript' },
      saveHistory: { path: 'advanced.saveHistory' },
    });
    const ch = i('clearHistory');
    if (ch)
      on(ch, 'click', async () => {
        if (cf('Clear all history? This cannot be undone.')) {
          await lr('comprehensive_history');
          this.a.notifications?.success('History cleared');
        }
      });
  }
  set(id, v) {
    const el = i(id);
    if (el) el.value = v;
  }
  chk(id, v) {
    const el = i(id);
    if (el) el.checked = v;
  }
  renderStrategies(order) {
    const list = i('strategyList');
    if (!list) return;
    list.innerHTML = '';
    const names = {
      'dom-automation': 'DOM Automation',
      'genius': 'Genius Lyrics',
      'speech-to-text': 'Speech to Text'
    };
    order.forEach(key => {
      if (!names[key]) return;
      const li = ce('li');
      li.className = 'sortable-item';
      li.draggable = true;
      li.dataset.key = key;
      li.innerHTML = `<span class="drag-handle">☰</span> <span>${names[key]}</span>`;
      this.addDnD(li);
      list.appendChild(li);
    });
  }
  addDnD(el) {
    on(el, 'dragstart', e => {
      this.dragSrc = el;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    on(el, 'dragend', () => {
      this.dragSrc = null;
      el.classList.remove('dragging');
      this.saveOrder();
    });
    on(el, 'dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      return false;
    });
    on(el, 'dragenter', () => {
      if (this.dragSrc !== el) el.classList.add('over');
    });
    on(el, 'dragleave', () => {
      el.classList.remove('over');
    });
    on(el, 'drop', e => {
      e.stopPropagation();
      if (this.dragSrc !== el) {
        const list = i('strategyList');
        const items = [...$$('.sortable-item', list)];
        const srcIdx = items.indexOf(this.dragSrc);
        const tgtIdx = items.indexOf(el);
        if (srcIdx < tgtIdx) el.after(this.dragSrc);
        else el.before(this.dragSrc);
      }
      return false;
    });
  }
  async saveOrder() {
    const list = i('strategyList');
    const order = [...$$('.sortable-item', list)].map(el => el.dataset.key);
    await this.s.update('transcript.strategyOrder', order);
  }
}
