import { id, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';
import { prompts as defaultPrompts } from '../../api/prompts/index.js';

export class PromptsSettings {
  constructor(sm, nm) {
    this.sm = sm;
    this.nm = nm;
  }

  init() {
    try {
      this.loadSettings();
      this.attachListeners();
    } catch (err) {
      e('[PromptsSettings] Init error:', err);
    }
  }

  loadSettings() {
    try {
      const savedPrompts = this.sm.get('prompts') || {};

      this.setValue('prompt-summary', savedPrompts.summary || defaultPrompts.comprehensive);
      this.setValue('prompt-chat', savedPrompts.chat || defaultPrompts.comments); // Assuming chat uses comments or similar base
      this.setValue('prompt-segments', savedPrompts.segments || defaultPrompts.segments);
      this.setValue('prompt-comments', savedPrompts.comments || defaultPrompts.comments);
    } catch (err) {
      e('[PromptsSettings] Load error:', err);
    }
  }

  attachListeners() {
    try {
      const textareas = ['prompt-summary', 'prompt-chat', 'prompt-segments', 'prompt-comments'];

      textareas.forEach(inputId => {
        const el = id(inputId);
        if (el) on(el, 'change', () => this.save());
      });

      // Reset buttons
      on(id('reset-prompt-summary'), 'click', () =>
        this.reset('summary', defaultPrompts.comprehensive)
      );
      on(id('reset-prompt-chat'), 'click', () => this.reset('chat', defaultPrompts.comments));
      on(id('reset-prompt-segments'), 'click', () =>
        this.reset('segments', defaultPrompts.segments)
      );
      on(id('reset-prompt-comments'), 'click', () =>
        this.reset('comments', defaultPrompts.comments)
      );
    } catch (err) {
      e('[PromptsSettings] Attach listeners error:', err);
    }
  }

  async save() {
    try {
      const prompts = {
        summary: this.getValue('prompt-summary'),
        chat: this.getValue('prompt-chat'),
        segments: this.getValue('prompt-segments'),
        comments: this.getValue('prompt-comments'),
      };

      this.sm.set('prompts', prompts);
      await this.sm.save();
      this.nm.show('Prompt settings saved', 'success');
    } catch (err) {
      e('[PromptsSettings] Save error:', err);
      this.nm.show('Failed to save prompt settings', 'error');
    }
  }

  async reset(key, defaultValue) {
    try {
      this.setValue(`prompt-${key}`, defaultValue);
      await this.save();
      this.nm.show(`Reset ${key} prompt to default`, 'success');
    } catch (err) {
      e('[PromptsSettings] Reset error:', err);
    }
  }

  setValue(elementId, value) {
    const el = id(elementId);
    if (el) el.value = value || '';
  }

  getValue(elementId) {
    const el = id(elementId);
    return el ? el.value : '';
  }
}
