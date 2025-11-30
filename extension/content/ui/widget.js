import { gu } from '../../utils/shortcuts/runtime.js';
import { af } from '../../utils/shortcuts/array.js';

const { findSecondaryColumn, isWidgetProperlyVisible } = await import(gu('content/utils/dom.js'));
const { initTabs } = await import(gu('content/ui/tabs.js'));
const { attachEventListeners } = await import(gu('content/handlers/events.js'));
const { createWidgetHTML } = await import(gu('content/ui/components/widget/structure.js'));
const { qs: $, id: ge, on, el: ce, wfe, mo } = await import(gu('utils/shortcuts/dom.js'));
const { e } = await import(gu('utils/shortcuts/log.js'));
const { si, ci, to } = await import(gu('utils/shortcuts/global.js'));
const { log } = await import(gu('utils/shortcuts/core.js'));
const { sg, ss } = await import(gu('utils/shortcuts/storage.js'));

let widgetContainer = null,
  resizeObserver = null,
  containerObserver = null,
  positionCheckInterval = null,
  lastKnownContainer = null,
  widgetConfig = null,
  isResizing = false,
  startY = 0,
  startHeight = 0;

function updateWidgetHeight() {
  try {
    if (!widgetContainer) return;
    const p = $('#movie_player') || $('.html5-video-player');
    if (p) {
      const h = p.offsetHeight;
      if (h > 0) widgetContainer.style.maxHeight = `${h}px`;
    }
  } catch (err) {
    e('Err:updateWidgetHeight', err);
  }
}

function ensureWidgetAtTop(c) {
  try {
    if (!widgetContainer) return;
    if (!c) {
      c = widgetContainer.parentElement;
      if (!c) {
        reattachWidget();
        return;
      }
    }
    lastKnownContainer = c;
    if (c.firstChild !== widgetContainer) {
      c.insertBefore(widgetContainer, c.firstChild);
    }
    if (!widgetContainer.style.order || widgetContainer.style.order !== '-9999')
      widgetContainer.style.order = '-9999';
  } catch (err) {
    e('Err:ensureWidgetAtTop', err);
  }
}

function reattachWidget() {
  try {
    if (!widgetContainer) return;
    const sc = findSecondaryColumn();
    if (sc) {
      sc.insertBefore(widgetContainer, sc.firstChild);
      lastKnownContainer = sc;
      setupObservers(sc);
    } else e('Err:reattachWidget', 'Cannot reattach widget: secondary column not found');
  } catch (err) {
    e('Err:reattachWidget', err);
  }
}

function startPositionMonitoring() {
  try {
    if (positionCheckInterval) ci(positionCheckInterval);
    positionCheckInterval = si(() => {
      if (!widgetContainer) {
        ci(positionCheckInterval);
        return;
      }
      if (!document.contains(widgetContainer)) {
        reattachWidget();
        return;
      }
      const p = widgetContainer.parentElement;
      if (p && p.firstChild !== widgetContainer) ensureWidgetAtTop(p);
    }, 500);
  } catch (err) {
    e('Err:startPositionMonitoring', err);
  }
}

export async function injectWidget() {
  try {
    const cfg = await loadWidgetConfig();
    widgetConfig = cfg;
    const ex = ge('yt-ai-master-widget');
    if (ex) {
      if (isWidgetProperlyVisible(ex)) {
        widgetContainer = ex;
        const c = ex.parentElement;
        lastKnownContainer = c;
        ensureWidgetAtTop(c);
        applyWidgetConfig();
        setupObservers(c);
        startPositionMonitoring();
        log('Widget already properly visible, reusing existing');
        return;
      }
      log('Widget exists but not properly visible, removing and re-injecting');
      ex.remove();
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (containerObserver) {
      containerObserver.disconnect();
      containerObserver = null;
    }
    let sc = findSecondaryColumn(),
      att = 0;
    while (!sc && att < 20) {
      try {
        sc = await wfe(
          '#secondary-inner, #secondary, #related, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary',
          500
        );
        if (sc) break;
      } catch (err) {
        void err;
      }
      att++;
      await new Promise(r => to(r, 200));
    }
    if (!sc) {
      sc = $('#columns');
      if (!sc) {
        e('Target container not found. Widget injection aborted.');
        return;
      }
      log('Using fallback #columns container');
    }
    widgetContainer = ce('div');
    widgetContainer.id = 'yt-ai-master-widget';
    widgetContainer.style.order = '-9999';
    widgetContainer.innerHTML = createWidgetHTML(cfg);
    sc.insertBefore(widgetContainer, sc.firstChild);
    lastKnownContainer = sc;

    // Apply default collapsed state if configured
    await applyDefaultWidgetState();

    applyWidgetConfig();
    setupWidgetLogic(widgetContainer);
    setupObservers(sc);
    startPositionMonitoring();
  } catch (err) {
    e('Err:injectWidget', err);
  }
}

async function loadWidgetConfig() {
  try {
    const r = await sg('config');
    const defaults = {
      height: 500,
      minHeight: 200,
      maxHeight: 1200,
      width: 400,
      minWidth: 300,
      maxWidth: 800,
      resizable: true,
      resizableWidth: false,
      position: 'right',
      tabs: { summary: true, segments: true, chat: true, comments: true },
      defaultCollapsed: false,
      rememberState: true,
      segmentFilters: {
        sponsor: true,
        selfpromo: true,
        interaction: true,
        intro: true,
        outro: true,
        preview: true,
        filler: true,
        highlight: true,
        exclusive: true,
      },
    };

    if (!r.config?.widget) return defaults;

    // Merge with defaults to ensure all properties exist
    return {
      ...defaults,
      ...r.config.widget,
      tabs: { ...defaults.tabs, ...r.config.widget.tabs },
      segmentFilters: { ...defaults.segmentFilters, ...r.config.widget.segmentFilters },
    };
  } catch (err) {
    e('Err:loadWidgetConfig', err);
    return {
      height: 500,
      minHeight: 200,
      maxHeight: 1200,
      width: 400,
      minWidth: 300,
      maxWidth: 800,
      resizable: true,
      resizableWidth: false,
      position: 'right',
      tabs: { summary: true, segments: true, chat: true, comments: true },
      defaultCollapsed: false,
      rememberState: true,
      segmentFilters: {
        sponsor: true,
        selfpromo: true,
        interaction: true,
        intro: true,
        outro: true,
        preview: true,
        filler: true,
        highlight: true,
        exclusive: true,
      },
    };
  }
}

function applyWidgetConfig() {
  try {
    if (!widgetContainer || !widgetConfig) return;
    const ca = $('#yt-ai-content-area', widgetContainer);
    if (ca) ca.style.height = `${widgetConfig.height}px`;
    const rh = $('#yt-ai-resize-handle', widgetContainer);
    if (rh) rh.style.display = widgetConfig.resizable ? 'block' : 'none';
  } catch (err) {
    e('Err:applyWidgetConfig', err);
  }
}

async function saveWidgetHeight(h) {
  try {
    const r = await sg('config');
    const cfg = r.config || {};
    cfg.widget = cfg.widget || {};
    cfg.widget.height = h;
    await ss({ config: cfg });
  } catch (err) {
    e('Err:saveWidgetHeight', err);
  }
}

function setupResizeHandle(c) {
  try {
    const rh = $('#yt-ai-resize-handle', c);
    if (!rh || !widgetConfig?.resizable) return;
    on(rh, 'mousedown', ev => {
      ev.preventDefault();
      isResizing = true;
      startY = ev.clientY;
      const ca = $('#yt-ai-content-area', c);
      startHeight = ca ? ca.offsetHeight : widgetConfig.height;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    });
    on(document, 'mousemove', ev => {
      if (!isResizing) return;
      ev.preventDefault();
      const dy = ev.clientY - startY;
      let nh = startHeight + dy;
      nh = Math.max(widgetConfig.minHeight, Math.min(widgetConfig.maxHeight, nh));
      const ca = $('#yt-ai-content-area', c);
      if (ca) ca.style.height = `${nh}px`;
    });
    on(document, 'mouseup', async () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const ca = $('#yt-ai-content-area', c);
      if (ca) await saveWidgetHeight(ca.offsetHeight);
    });
  } catch (err) {
    e('Err:setupResizeHandle', err);
  }
}

function setupWidgetLogic(c) {
  try {
    const cb = $('#yt-ai-close-btn', c);
    if (cb) {
      on(cb, 'click', () => {
        const ic = c.classList.contains('yt-ai-collapsed');
        if (ic) {
          c.classList.remove('yt-ai-collapsed');
          cb.textContent = '❌';
          cb.title = 'Collapse';
          saveWidgetState(false);
        } else {
          c.classList.add('yt-ai-collapsed');
          cb.textContent = '⬇️';
          cb.title = 'Expand';
          saveWidgetState(true);
        }
      });
    }
    setupResizeHandle(c);
    initTabs(c);
    attachEventListeners(c);
  } catch (err) {
    e('Err:setupWidgetLogic', err);
  }
}

async function applyDefaultWidgetState() {
  try {
    if (!widgetContainer || !widgetConfig) return;

    const cb = $('#yt-ai-close-btn', widgetContainer);
    if (!cb) return;

    // Check if we should remember state
    if (widgetConfig.rememberState) {
      const savedState = await getSavedWidgetState();
      if (savedState !== null) {
        // Apply saved state
        if (savedState) {
          widgetContainer.classList.add('yt-ai-collapsed');
          cb.textContent = '⬇️';
          cb.title = 'Expand';
        }
        return;
      }
    }

    // Apply default collapsed state if no saved state
    if (widgetConfig.defaultCollapsed) {
      widgetContainer.classList.add('yt-ai-collapsed');
      cb.textContent = '⬇️';
      cb.title = 'Expand';
    }
  } catch (err) {
    e('Err:applyDefaultWidgetState', err);
  }
}

async function saveWidgetState(isCollapsed) {
  try {
    if (!widgetConfig?.rememberState) return;
    await ss({ widgetCollapsedState: isCollapsed });
  } catch (err) {
    e('Err:saveWidgetState', err);
  }
}

async function getSavedWidgetState() {
  try {
    const r = await sg('widgetCollapsedState');
    return r.widgetCollapsedState ?? null;
  } catch {
    return null;
  }
}

function setupObservers(c) {
  try {
    updateWidgetHeight();
    const p = $('#movie_player') || $('.html5-video-player');
    if (resizeObserver) resizeObserver.disconnect();
    if (p) {
      resizeObserver = new ResizeObserver(() => updateWidgetHeight());
      resizeObserver.observe(p);
    }
    if (containerObserver) containerObserver.disconnect();
    containerObserver = mo(m => {
      for (const mu of m) {
        if (mu.type === 'childList') {
          if (af(mu.removedNodes).includes(widgetContainer)) {
            to(() => reattachWidget(), 100);
            return;
          }
          if (c.firstChild !== widgetContainer && !af(mu.addedNodes).includes(widgetContainer))
            ensureWidgetAtTop(c);
        }
      }
    });
    containerObserver.observe(c, { childList: true, subtree: false });
    const bo = mo(() => {
      if (!document.contains(widgetContainer)) {
        reattachWidget();
      } else if (widgetContainer.parentElement !== lastKnownContainer) {
        const np = widgetContainer.parentElement;
        if (np) {
          lastKnownContainer = np;
          setupObservers(np);
        }
      }
    });
    bo.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    e('Err:setupObservers', err);
  }
}

export function getWidget() {
  try {
    return widgetContainer;
  } catch (err) {
    e('Err:getWidget', err);
    return null;
  }
}
