// Mock dependencies
vi.mock('../../../extension/utils/shortcuts/global.js', () => ({
  to: vi.fn(),
}));

vi.mock('../../../extension/utils/shortcuts/async.js', () => ({
  raf: vi.fn(cb => cb()),
}));

vi.mock('../../../extension/utils/shortcuts/dom.js', () => ({
  ce: vi.fn(),
  ap: vi.fn(),
}));

// Mock document
const mockContainer = {
  id: '',
  style: {},
  appendChild: vi.fn(),
};

const mockNotification = {
  className: '',
  innerHTML: '',
  style: {},
  remove: vi.fn(),
};

global.document = {
  body: {
    appendChild: vi.fn(),
  },
};

// Import after mocks
// Import after mocks
import { NotificationManager } from '../../../extension/options/modules/notification-manager.js';
import { to } from '../../../extension/utils/shortcuts/global.js';
import { raf } from '../../../extension/utils/shortcuts/async.js';
import { ce, ap } from '../../../extension/utils/shortcuts/dom.js';

describe('NotificationManager', () => {
  let manager;
  let mockTo, mockRaf, mockCe, mockAp;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTo = to;
    mockRaf = raf;
    mockCe = ce;
    mockAp = ap;

    mockCe.mockImplementation(tag => {
      if (tag === 'div') {
        if (!mockContainer.id) {
          return { ...mockContainer, id: 'notification-container' };
        }
        return { ...mockNotification };
      }
    });

    manager = new NotificationManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('init', () => {
    it('should create container when document.body exists', () => {
      manager.init();

      expect(mockCe).toHaveBeenCalledWith('div');
      expect(mockAp).toHaveBeenCalledWith(document.body, expect.any(Object));
      expect(manager.container.id).toBe('notification-container');
    });

    it('should retry init when document.body not ready', () => {
      const originalBody = document.body;
      delete document.body;

      manager.init();

      expect(mockTo).toHaveBeenCalledWith(expect.any(Function), 100);

      document.body = originalBody;
    });
  });

  describe('show', () => {
    beforeEach(() => {
      manager.container = mockContainer;
    });

    it('should return null when container not initialized', () => {
      manager.container = null;

      const result = manager.show('test');

      expect(result).toBeNull();
    });

    it('should create and show notification', () => {
      const result = manager.show('Test message', 'success', 2000);

      expect(mockCe).toHaveBeenCalledWith('div');
      expect(mockAp).toHaveBeenCalledWith(mockContainer, mockNotification);
      expect(mockNotification.className).toBe('notification notification-success');
      expect(mockNotification.innerHTML).toContain('✓');
      expect(mockNotification.innerHTML).toContain('Test message');
      expect(mockRaf).toHaveBeenCalledTimes(2);
      expect(mockTo).toHaveBeenCalledWith(expect.any(Function), 2000);
      expect(result).toBe(mockNotification);
    });

    it('should auto-hide after duration', () => {
      manager.show('test', 'info', 1000);

      // Trigger the timeout callback
      const hideCallback = mockTo.mock.calls[0][0];
      hideCallback();

      expect(mockNotification.style.transform).toBe('translateX(400px)');

      // Trigger remove timeout
      const removeCallback = mockTo.mock.calls[1][0];
      removeCallback();

      expect(mockNotification.remove).toHaveBeenCalled();
    });
  });

  describe('getIcon', () => {
    it('should return correct icons', () => {
      expect(manager.getIcon('success')).toBe('✓');
      expect(manager.getIcon('error')).toBe('✗');
      expect(manager.getIcon('warning')).toBe('⚠');
      expect(manager.getIcon('info')).toBe('ℹ');
      expect(manager.getIcon('saving')).toBe('💾');
      expect(manager.getIcon('unknown')).toBe('ℹ');
    });
  });

  describe('getBackground', () => {
    it('should return correct backgrounds', () => {
      expect(manager.getBackground('success')).toBe('#00d26a');
      expect(manager.getBackground('error')).toBe('#ff4444');
      expect(manager.getBackground('warning')).toBe('#ffcc00');
      expect(manager.getBackground('info')).toBe('#3ea6ff');
      expect(manager.getBackground('saving')).toBe('#666');
      expect(manager.getBackground('unknown')).toBe('#3ea6ff');
    });
  });

  describe('getColor', () => {
    it('should return correct colors', () => {
      expect(manager.getColor('success')).toBe('#000');
      expect(manager.getColor('error')).toBe('#fff');
      expect(manager.getColor('warning')).toBe('#000');
      expect(manager.getColor('info')).toBe('#fff');
      expect(manager.getColor('saving')).toBe('#fff');
      expect(manager.getColor('unknown')).toBe('#fff');
    });
  });

  describe('getBorderColor', () => {
    it('should return correct border colors', () => {
      expect(manager.getBorderColor('success')).toBe('#00ff88');
      expect(manager.getBorderColor('error')).toBe('#ff6666');
      expect(manager.getBorderColor('warning')).toBe('#ffdd44');
      expect(manager.getBorderColor('info')).toBe('#5eb8ff');
      expect(manager.getBorderColor('saving')).toBe('#888');
      expect(manager.getBorderColor('unknown')).toBe('#5eb8ff');
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      manager.container = mockContainer;
    });

    it('should call show with correct parameters', () => {
      const showSpy = vi.spyOn(manager, 'show');

      manager.success('Success!');
      expect(showSpy).toHaveBeenCalledWith('Success!', 'success');

      manager.error('Error!');
      expect(showSpy).toHaveBeenCalledWith('Error!', 'error', 5000);

      manager.warning('Warning!');
      expect(showSpy).toHaveBeenCalledWith('Warning!', 'warning', 4000);

      manager.info('Info!');
      expect(showSpy).toHaveBeenCalledWith('Info!', 'info');

      manager.saving('Custom saving...');
      expect(showSpy).toHaveBeenCalledWith('Custom saving...', 'saving', 1000);

      manager.saving();
      expect(showSpy).toHaveBeenCalledWith('Saving...', 'saving', 1000);
    });
  });
});
