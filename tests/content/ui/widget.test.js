import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock runtime first
vi.mock('../../../extension/utils/shortcuts/runtime.js', () => ({
  gu: path => {
    const mapping = {
      'content/utils/dom.js': '../utils/dom.js',
      'content/ui/tabs.js': './tabs.js',
      'content/handlers/events.js': '../../handlers/events.js',
      'content/ui/components/widget/structure.js': './components/widget/structure.js',
      'utils/shortcuts/dom.js': '../../../utils/shortcuts/dom.js',
      'utils/shortcuts/log.js': '../../../utils/shortcuts/log.js',
      'utils/shortcuts/global.js': '../../../utils/shortcuts/global.js',
      'utils/shortcuts/core.js': '../../../utils/shortcuts/core.js',
      'utils/shortcuts/storage.js': '../../../utils/shortcuts/storage.js',
      'utils/shortcuts.js': '../../../utils/shortcuts.js',
      '../../utils/shortcuts/array.js': '../../../utils/shortcuts/array.js',
    };
    return mapping[path] || path;
  },
}));

// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/array.js', () => ({
  af: arr => Array.from(arr),
}));

vi.mock('../../../extension/content/utils/dom.js', () => ({
  findSecondaryColumn: vi.fn(),
  isWidgetProperlyVisible: vi.fn(),
}));

vi.mock('../../../extension/content/ui/tabs.js', () => ({
  initTabs: vi.fn(),
}));

vi.mock('../../../extension/content/handlers/events.js', () => ({
  attachEventListeners: vi.fn(),
}));

vi.mock('../../../extension/content/ui/components/widget/structure.js', () => ({
  createWidgetHTML: vi.fn().mockReturnValue('<div class="mock-widget-html"></div>'),
}));

vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  qs: (sel, ctx) => (ctx || document).querySelector(sel),
  id: id => document.getElementById(id),
  on: vi.fn(),
  el: tag => document.createElement(tag),
  wfe: vi.fn(),
  mo: vi.fn().mockReturnValue({ observe: vi.fn(), disconnect: vi.fn() }),
}));

vi.mock('../../../extension/utils/shortcuts/log.js', () => ({
  e: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/global.js', () => ({
  si: vi.fn(),
  ci: vi.fn(),
  to: cb => cb(),
}));

vi.mock('../../../extension/utils/shortcuts/core.js', () => ({
  log: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/storage.js', () => ({
  sg: vi.fn(),
  ss: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts.js', () => ({
  ael: vi.fn(),
  stc: (el, txt) => {
    if (el) el.textContent = txt;
  },
  ih: (el, html) => {
    if (el) el.innerHTML = html;
  },
}));

// Import module under test
import { injectWidget, getWidget } from '../../../extension/content/ui/widget.js';
import {
  findSecondaryColumn,
  isWidgetProperlyVisible,
} from '../../../extension/content/utils/dom.js';
import { sg } from '../../../extension/utils/shortcuts/storage.js';
import { wfe } from '../../../extension/utils/shortcuts/dom.js';

describe('Widget Logic', () => {
  let secondaryColumn;

  beforeEach(() => {
    document.body.innerHTML = '';
    secondaryColumn = document.createElement('div');
    secondaryColumn.id = 'secondary';
    document.body.appendChild(secondaryColumn);
    vi.clearAllMocks();

    // Default mocks
    findSecondaryColumn.mockReturnValue(secondaryColumn);
    sg.mockResolvedValue({});
    wfe.mockResolvedValue(secondaryColumn);
  });

  it('should inject widget into secondary column', async () => {
    await injectWidget();

    const widget = document.getElementById('yt-ai-master-widget');
    expect(widget).not.toBeNull();
    expect(secondaryColumn.contains(widget)).toBe(true);
  });

  it('should reuse existing widget if visible', async () => {
    const existing = document.createElement('div');
    existing.id = 'yt-ai-master-widget';
    secondaryColumn.appendChild(existing);

    isWidgetProperlyVisible.mockReturnValue(true);

    await injectWidget();

    expect(document.getElementById('yt-ai-master-widget')).toBe(existing);
  });

  it('should remove and re-inject if existing widget is not visible', async () => {
    const existing = document.createElement('div');
    existing.id = 'yt-ai-master-widget';
    document.body.appendChild(existing); // Not in secondary

    isWidgetProperlyVisible.mockReturnValue(false);

    await injectWidget();

    const newWidget = document.getElementById('yt-ai-master-widget');
    expect(newWidget).not.toBe(existing);
    expect(secondaryColumn.contains(newWidget)).toBe(true);
  });

  it('should load config and apply styles', async () => {
    sg.mockResolvedValue({
      config: {
        widget: {
          height: 600,
          opacity: 90,
          accentColor: '#ff0000',
        },
      },
    });

    await injectWidget();

    const widget = getWidget();
    // Check if styles applied (mocked via applyWidgetConfig logic)
    // Since we can't easily check computed styles in JSDOM for variables set via style.setProperty
    // We can check style attribute or properties
    expect(widget.style.getPropertyValue('--yt-ai-bg-glass')).toBe('rgba(15, 15, 15, 0.9)');
    expect(widget.style.getPropertyValue('--yt-ai-accent')).toBe('#ff0000');
  });
});
