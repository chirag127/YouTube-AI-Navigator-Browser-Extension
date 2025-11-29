import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotificationManager } from '../extension/options/modules/notification-manager.js';

vi.mock('../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn((fn, delay) => setTimeout(fn, delay)),
}));

vi.mock('../extension/utils/shortcuts/async.js', () => ({
    raf: vi.fn(fn => requestAnimationFrame(fn)),
}));

vi.mock('../extension/utils/shortcuts/dom.js', () => ({
    ce: vi.fn(tag => document.createElement(tag)),
    ap: vi.fn((parent, child) => parent.appendChild(child)),
}));

describe('NotificationManager', () => {
    let notificationManager;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        document.body.innerHTML = '';
        notificationManager = new NotificationManager();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with container', () => {
        expect(notificationManager.container).toBeDefined();
        expect(notificationManager.queue).toEqual([]);
        expect(notificationManager.isShowing).toBe(false);
    });

    it('should show success notification', () => {
        const notification = notificationManager.success('Test success');

        expect(notification).toBeDefined();
        expect(notification.className).toContain('notification-success');
    });

    it('should show error notification', () => {
        const notification = notificationManager.error('Test error');

        expect(notification).toBeDefined();
        expect(notification.className).toContain('notification-error');
    });

    it('should show warning notification', () => {
        const notification = notificationManager.warning('Test warning');

        expect(notification).toBeDefined();
        expect(notification.className).toContain('notification-warning');
    });

    it('should show info notification', () => {
        const notification = notificationManager.info('Test info');

        expect(notification).toBeDefined();
        expect(notification.className).toContain('notification-info');
    });

    it('should show saving notification', () => {
        const notification = notificationManager.saving('Saving...');

        expect(notification).toBeDefined();
        expect(notification.className).toContain('notification-saving');
    });

    it('should get correct icon for type', () => {
        expect(notificationManager.getIcon('success')).toBe('✓');
        expect(notificationManager.getIcon('error')).toBe('✗');
        expect(notificationManager.getIcon('warning')).toBe('⚠');
        expect(notificationManager.getIcon('info')).toBe('ℹ');
        expect(notificationManager.getIcon('saving')).toBe('💾');
    });

    it('should get correct background color for type', () => {
        expect(notificationManager.getBackground('success')).toBe('#00d26a');
        expect(notificationManager.getBackground('error')).toBe('#ff4444');
        expect(notificationManager.getBackground('warning')).toBe('#ffcc00');
        expect(notificationManager.getBackground('info')).toBe('#3ea6ff');
    });

    it('should remove notification after duration', () => {
        const notification = notificationManager.show('Test', 'success', 1000);
        const removeSpy = vi.spyOn(notification, 'remove');

        vi.advanceTimersByTime(1300);

        expect(removeSpy).toHaveBeenCalled();
    });
});
