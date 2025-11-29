import { findSecondaryColumn, isWidgetProperlyVisible } from '../utils/dom.js';
import { initTabs } from './tabs.js';
import { attachEventListeners } from '../handlers/events.js';
import { log, logError, waitForElement } from '../core/debug.js';
import { createWidgetHTML } from './components/widget/structure.js';
import { qs as $, id as ge, on, ce } from '../../utils/shortcuts/dom.js';
import { si, csi, st } from '../../utils/shortcuts/time.js';

let widgetContainer = null,
  resizeObserver = null,
  containerObserver = null,
  positionCheckInterval = null,
  lastKnownContainer = null;

function updateWidgetHeight() {
  if (!widgetContainer) return;
  const p = $('#movie_player') || $('.html5-video-player');
  if (p) {
    const h = p.offsetHeight;
    if (h > 0) widgetContainer.style.maxHeight = `${h}px`;
  }
}

function ensureWidgetAtTop(c) {
  if (!widgetContainer) return;
  if (!c) {
    c = widgetContainer.parentElement;
    if (!c) {
      log('Widget has no parent, attempting re-injection...');
      reattachWidget();
      return;
    }
  }
  lastKnownContainer = c;
  if (c.firstChild !== widgetContainer) {
    log('Widget displaced, moving to top...');
    c.insertBefore(widgetContainer, c.firstChild);
  }
  if (!widgetContainer.style.order || widgetContainer.style.order !== '-9999')
    widgetContainer.style.order = '-9999';
}

function reattachWidget() {
  if (!widgetContainer) return;
  log('Attempting to reattach widget...');
  const sc = findSecondaryColumn();
  if (sc) {
    sc.insertBefore(widgetContainer, sc.firstChild);
    lastKnownContainer = sc;
    setupObservers(sc);
    log('Widget reattached successfully');
  } else logError('Cannot reattach widget: secondary column not found');
}

function startPositionMonitoring() {
  if (positionCheckInterval) csi(positionCheckInterval);
  positionCheckInterval = si(() => {
    if (!widgetContainer) {
      csi(positionCheckInterval);
      return;
    }
    if (!document.contains(widgetContainer)) {
      log('Widget removed from DOM, attempting reattachment...');
      reattachWidget();
      return;
    }
    const p = widgetContainer.parentElement;
    if (p && p.firstChild !== widgetContainer) ensureWidgetAtTop(p);
  }, 500);
}

export async function injectWidget() {
  log('Attempting to inject widget...');
  const ex = ge('yt-ai-master-widget');
  if (ex) {
    if (isWidgetProperlyVisible(ex)) {
      widgetContainer = ex;
      const c = ex.parentElement;
      lastKnownContainer = c;
      ensureWidgetAtTop(c);
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
    if (att % 5 === 0) log(`Waiting for secondary column... (${att}/20)`);
    try {
      sc = await waitForElement(
        '#secondary-inner, #secondary, #related, ytd-watch-next-secondary-results-renderer, ytd-watch-flexy #secondary',
        500
      );
      if (sc) break;
    } catch (err) {
      void err;
    }
    att++;
    await new Promise(r => st(r, 200));
  }
  if (!sc) {
    sc = $('#columns');
    if (!sc) {
      logError('Target container not found. Widget injection aborted.');
      return;
    }
    log('Using fallback #columns container');
  }
  log('Creating widget element...');
  widgetContainer = ce('div');
  widgetContainer.id = 'yt-ai-master-widget';
  widgetContainer.style.order = '-9999';
  widgetContainer.innerHTML = createWidgetHTML();
  log('Inserting widget into DOM...');
  sc.insertBefore(widgetContainer, sc.firstChild);
  lastKnownContainer = sc;
  setupWidgetLogic(widgetContainer);
  setupObservers(sc);
  startPositionMonitoring();
  log('Widget injection complete ✓');
}

function setupWidgetLogic(c) {
  const cb = $('#yt-ai-close-btn', c);
  if (cb) {
    on(cb, 'click', () => {
      const ic = c.classList.contains('yt-ai-collapsed');
      if (ic) {
        log('Expanding widget...');
        c.classList.remove('yt-ai-collapsed');
        cb.textContent = '❌';
        cb.title = 'Collapse';
      } else {
        log('Collapsing widget...');
        c.classList.add('yt-ai-collapsed');
        cb.textContent = '⬇️';
        cb.title = 'Expand';
      }
    });
  }
  initTabs(c);
  attachEventListeners(c);
}

function setupObservers(c) {
  updateWidgetHeight();
  const p = $('#movie_player') || $('.html5-video-player');
  if (resizeObserver) resizeObserver.disconnect();
  if (p) {
    resizeObserver = new ResizeObserver(() => updateWidgetHeight());
    resizeObserver.observe(p);
  }
  if (containerObserver) containerObserver.disconnect();
  containerObserver = new MutationObserver(m => {
    for (const mu of m) {
      if (mu.type === 'childList') {
        if (Array.from(mu.removedNodes).includes(widgetContainer)) {
          log('Widget was removed, reattaching...');
          st(() => reattachWidget(), 100);
          return;
        }
        if (
          c.firstChild !== widgetContainer &&
          !Array.from(mu.addedNodes).includes(widgetContainer)
        )
          ensureWidgetAtTop(c);
      }
    }
  });
  containerObserver.observe(c, { childList: true, subtree: false });
  const bo = new MutationObserver(() => {
    if (!document.contains(widgetContainer)) {
      log('Widget lost from DOM tree, reattaching...');
      reattachWidget();
    } else if (widgetContainer.parentElement !== lastKnownContainer) {
      log('Widget parent changed, updating observers...');
      const np = widgetContainer.parentElement;
      if (np) {
        lastKnownContainer = np;
        setupObservers(np);
      }
    }
  });
  bo.observe(document.body, { childList: true, subtree: true });
}

export function getWidget() {
  return widgetContainer;
}
