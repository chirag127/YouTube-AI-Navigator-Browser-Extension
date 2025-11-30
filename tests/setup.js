import { vi } from 'vitest';

global.chrome = {
  runtime: {
    getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
  },
};

global.window = {
  ...global.window,
  top: global.window,
  location: {
    hostname: 'www.youtube.com',
    search: '?v=test123',
  },
  scrollTo: vi.fn(),
};

global.document = {
  ...global.document,
  head: global.document.createElement('head'),
  documentElement: global.document.createElement('html'),
  createElement: global.document.createElement.bind(global.document),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
