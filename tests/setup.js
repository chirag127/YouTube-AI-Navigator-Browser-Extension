import { vi } from 'vitest';

global.chrome = {
  runtime: {
    getURL: vi.fn(path => `chrome-extension://mock-id/${path}`),
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    sendMessage: vi.fn(),
    onInstalled: { addListener: vi.fn() },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    onUpdated: { addListener: vi.fn() },
    onActivated: { addListener: vi.fn() },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: { addListener: vi.fn() },
  },
  windows: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
    insertCSS: vi.fn(),
  },
  action: {
    onClicked: { addListener: vi.fn() },
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
    removeAll: vi.fn(),
  },
};

global.fetch = vi.fn();
global.Request = vi.fn();
global.Response = vi.fn();
global.Headers = vi.fn();
global.FormData = vi.fn();
global.URLSearchParams = URLSearchParams;

// Mock DOM globals if needed (jsdom handles most)
if (typeof window !== 'undefined') {
  window.chrome = global.chrome;
}
