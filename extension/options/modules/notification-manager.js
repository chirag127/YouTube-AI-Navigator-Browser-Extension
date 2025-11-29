// Notification Manager for Settings Changes
export class NotificationManager {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getIcon(type);
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        `;

        notification.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: ${this.getBackground(type)};
            color: ${this.getColor(type)};
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(400px);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
            border: 1px solid ${this.getBorderColor(type)};
        `;

        this.container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ',
            saving: '💾'
        };
        return icons[type] || icons.info;
    }

    getBackground(type) {
        const backgrounds = {
            success: '#00d26a',
            error: '#ff4444',
            warning: '#ffcc00',
            info: '#3ea6ff',
            saving: '#666'
        };
        return backgrounds[type] || backgrounds.info;
    }

    getColor(type) {
        const colors = {
            success: '#000',
            error: '#fff',
            warning: '#000',
            info: '#fff',
            saving: '#fff'
        };
        return colors[type] || colors.info;
    }

    getBorderColor(type) {
        const borders = {
            success: '#00ff88',
            error: '#ff6666',
            warning: '#ffdd44',
            info: '#5eb8ff',
            saving: '#888'
        };
        return borders[type] || borders.info;
    }

    success(message) {
        return this.show(message, 'success');
    }

    error(message) {
        return this.show(message, 'error', 5000);
    }

    warning(message) {
        return this.show(message, 'warning', 4000);
    }

    info(message) {
        return this.show(message, 'info');
    }

    saving(message = 'Saving...') {
        return this.show(message, 'saving', 1000);
    }
}
