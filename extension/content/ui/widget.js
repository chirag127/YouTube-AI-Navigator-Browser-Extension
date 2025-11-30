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
const { ael, stc, ih } = await import(gu('utils/shortcuts.js'));

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

    // Dynamic viewport constraint
    const viewportHeight = window.innerHeight;
    const rect = widgetContainer.getBoundingClientRect();

    // Calculate available height from the top of the widget to the bottom of the viewport
    // We use a safety margin (default 20px) to ensure it doesn't touch the very edge
    const safetyMargin = widgetConfig.viewportMargin || 20;

    // If rect.top is negative (scrolled past), we still want to constrain max-height relative to viewport
    // but usually we care about the bottom not being clipped.
    // If widget is fixed/sticky, rect.top is constant. If relative, it changes.
    // We want: height + rect.top <= viewportHeight - margin
    // So: height <= viewportHeight - rect.top - margin

    // However, if rect.top is very small (or negative), we don't want the widget to disappear.
    // Let's clamp rect.top to a minimum of 0 for this calculation if we want to ensure full visibility
    // when top is visible.
    // But if user scrolls down, rect.top < 0. The widget moves up.
    // The issue is usually when rect.top > 0.

    let availableHeight = viewportHeight - Math.max(0, rect.top) - safetyMargin;

    // Enforce a reasonable minimum so it doesn't collapse completely
    availableHeight = Math.max(availableHeight, 200);

    // Apply constraint if Dynamic Height is enabled (default true)
    if (widgetConfig.dynamicHeight !== false) {
      widgetContainer.style.maxHeight = `${availableHeight}px`;
    } else {
      // Fallback to configured max height if dynamic is disabled
      widgetContainer.style.maxHeight = `${widgetConfig.maxHeight || 1200}px`;
    }

    const p = $('#movie_player') || $('.html5-video-player');
    if (p) {
      // Also respect player height if needed, but viewport is king for preventing clip
      // We don't strictly bind to player height anymore to allow independent sizing
      // but we ensure we don't overflow the window
    }

    // Ensure content area fits
    const header = $('.yt-ai-header', widgetContainer);
    const tabs = $('.yt-ai-tabs', widgetContainer);
    const chatInput = $('.yt-ai-chat-input', widgetContainer);

    if (header && tabs && chatInput) {
      const contentArea = $('#yt-ai-content-area', widgetContainer);
      if (contentArea) {
        // The container's max-height is now set.
        // We just need to ensure the content area takes up the remaining space properly
        // Flexbox on the container (display: flex; flex-direction: column) handles this naturally
        // provided the content area has flex: 1 and overflow-y: auto (which it does in CSS).

        // However, if we want to force a specific height:
        const currentHeight = widgetContainer.offsetHeight;
        if (widgetConfig.dynamicHeight !== false && currentHeight > availableHeight) {
          widgetContainer.style.height = `${availableHeight}px`;
        }
      }
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
    ih(widgetContainer, createWidgetHTML(cfg));
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

async function applyWidgetConfig() {
  try {
    if (!widgetContainer || !widgetConfig) return;
    const ca = $('#yt-ai-content-area', widgetContainer);
    if (ca) ca.style.height = `${widgetConfig.height}px`;
    if (widgetConfig.width && widgetConfig.resizableWidth) {
      widgetContainer.style.width = `${widgetConfig.width}px`;
      widgetContainer.style.maxWidth = `${widgetConfig.maxWidth}px`;
      widgetContainer.style.minWidth = `${widgetConfig.minWidth}px`;
    }

    // Apply Appearance Settings
    if (widgetConfig.opacity !== undefined) {
      const opacity = widgetConfig.opacity / 100;
      widgetContainer.style.setProperty('--yt-ai-bg-glass', `rgba(15, 15, 15, ${opacity})`);
    }

    if (widgetConfig.borderRadius !== undefined) {
      widgetContainer.style.setProperty('--yt-ai-radius', `${widgetConfig.borderRadius}px`);
    }

    if (widgetConfig.accentColor) {
      widgetContainer.style.setProperty('--yt-ai-accent', widgetConfig.accentColor);
    }

    // Load UI settings for font
    const r = await sg('config');
    const ui = r.config?.ui || {};
    if (ui.fontFamily) {
      const font =
        ui.fontFamily === 'System'
          ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          : `"${ui.fontFamily}", sans-serif`;
      widgetContainer.style.setProperty('--yt-ai-font', font);
    }

    if (widgetConfig.blur !== undefined) {
      widgetContainer.style.setProperty('--yt-ai-backdrop', `blur(${widgetConfig.blur}px)`);
      widgetContainer.style.backdropFilter = `blur(${widgetConfig.blur}px)`;
      widgetContainer.style.webkitBackdropFilter = `blur(${widgetConfig.blur}px)`;
    }

    if (widgetConfig.scale !== undefined) {
      const scale = widgetConfig.scale / 100;
      widgetContainer.style.fontSize = `${14 * scale}px`;
      // Scale other elements if needed, but font-size usually cascades
    }

    const rh = $('#yt-ai-resize-handle', widgetContainer);
    if (rh) rh.style.display = widgetConfig.resizable ? 'block' : 'none';
    const rwh = $('#yt-ai-resize-handle-width', widgetContainer);
    if (rwh) rwh.style.display = widgetConfig.resizableWidth ? 'block' : 'none';
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

let isResizingWidth = false;
let startX = 0;
let startWidth = 0;

function setupWidthResizeHandle(c) {
  try {
    const rwh = $('#yt-ai-resize-handle-width', c);
    if (!rwh || !widgetConfig?.resizableWidth) return;
    on(rwh, 'mousedown', ev => {
      ev.preventDefault();
      isResizingWidth = true;
      startX = ev.clientX;
      startWidth = c.offsetWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });
    on(document, 'mousemove', ev => {
      if (!isResizingWidth) return;
      ev.preventDefault();
      const dx = widgetConfig.position === 'right' ? startX - ev.clientX : ev.clientX - startX;
      let nw = startWidth + dx;
      nw = Math.max(widgetConfig.minWidth, Math.min(widgetConfig.maxWidth, nw));
      c.style.width = `${nw}px`;
    });
    on(document, 'mouseup', async () => {
      if (!isResizingWidth) return;
      isResizingWidth = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      await saveWidgetWidth(c.offsetWidth);
    });
  } catch (err) {
    e('Err:setupWidthResizeHandle', err);
  }
}

async function saveWidgetWidth(w) {
  try {
    const r = await sg('config');
    const cfg = r.config || {};
    cfg.widget = cfg.widget || {};
    cfg.widget.width = w;
    await ss({ config: cfg });
  } catch (err) {
    e('Err:saveWidgetWidth', err);
  }
}

function setupDragHandler(c) {
  try {
    const header = $('.yt-ai-header', c);
    if (!header) return;

    header.style.cursor = 'grab';

    let isDragging = false;
    let startX, startY, initialTransformX = 0, initialTransformY = 0;

    on(header, 'mousedown', e => {
      // Ignore if clicking buttons/inputs
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.yt-ai-icon-btn')) return;

      e.preventDefault();
      isDragging = true;
      header.style.cursor = 'grabbing';
      startX = e.clientX;
      startY = e.clientY;

      // Parse current transform
      const style = window.getComputedStyle(c);
      const matrix = new WebKitCSSMatrix(style.transform);
      initialTransformX = matrix.m41;
      initialTransformY = matrix.m42;

      document.body.style.userSelect = 'none';
    });

    on(document, 'mousemove', e => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      c.style.transform = `translate(${initialTransformX + dx}px, ${initialTransformY + dy}px)`;
    });

    on(document, 'mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
      document.body.style.userSelect = '';
    });
  } catch (err) {
    e('Err:setupDragHandler', err);
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
          stc(cb, '❌');
          cb.title = 'Collapse';
          saveWidgetState(false);
        } else {
          c.classList.add('yt-ai-collapsed');
          stc(cb, '⬇️');
          cb.title = 'Expand';
          saveWidgetState(true);
        }
      });
    }
    setupResizeHandle(c);
    setupWidthResizeHandle(c);
    setupDragHandler(c); // Add drag handler
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
          stc(cb, '⬇️');
          cb.title = 'Expand';
        }
        return;
      }
    }

    // Apply default collapsed state if no saved state
    if (widgetConfig.defaultCollapsed) {
      widgetContainer.classList.add('yt-ai-collapsed');
      stc(cb, '⬇️');
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
    // Also observe window resize for DevTools open/close
    ael(window, 'resize', updateWidgetHeight);

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
