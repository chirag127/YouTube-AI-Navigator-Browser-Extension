// InnerTube API Diagnostics Utility
// Comprehensive logging and debugging for InnerTube API calls

export class InnerTubeDiagnostics {
    constructor() {
        this.requestLog = [];
        this.maxLogSize = 50;
    }

    logRequest(type, videoId, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            videoId,
            ...details
        };

        this.requestLog.push(entry);
        if (this.requestLog.length > this.maxLogSize) {
            this.requestLog.shift();
        }

        console.log(`[InnerTube Diagnostics] 📊 Request logged:`, entry);
    }

    logResponse(type, videoId, success, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            videoId,
            success,
            ...details
        };

        this.requestLog.push(entry);
        if (this.requestLog.length > this.maxLogSize) {
            this.requestLog.shift();
        }

        const emoji = success ? '✅' : '❌';
        console.log(`[InnerTube Diagnostics] ${emoji} Response logged:`, entry);
    }

    async checkCookies() {
        const cookies = await chrome.cookies.getAll({ domain: '.youtube.com' });

        const critical = {
            SAPISID: cookies.find(c => c.name === 'SAPISID'),
            SSID: cookies.find(c => c.name === 'SSID'),
            SID: cookies.find(c => c.name === 'SID'),
            HSID: cookies.find(c => c.name === 'HSID'),
            APISID: cookies.find(c => c.name === 'APISID')
        };

        const report = {
            totalCookies: cookies.length,
            criticalCookies: {
                SAPISID: !!critical.SAPISID,
                SSID: !!critical.SSID,
                SID: !!critical.SID,
                HSID: !!critical.HSID,
                APISID: !!critical.APISID
            },
            allCookieNames: cookies.map(c => c.name),
            isLoggedIn: !!(critical.SAPISID && critical.SSID && critical.SID)
        };

        console.log('[InnerTube Diagnostics] 🍪 Cookie Report:', report);
        return report;
    }

    async checkPermissions() {
        const permissions = {
            cookies: await chrome.permissions.contains({ permissions: ['cookies'] }),
            storage: await chrome.permissions.contains({ permissions: ['storage'] }),
            webRequest: await chrome.permissions.contains({ permissions: ['webRequest'] })
        };

        console.log('[InnerTube Diagnostics] 🔐 Permissions:', permissions);
        return permissions;
    }

    getRecentLogs(count = 10) {
        return this.requestLog.slice(-count);
    }

    exportDiagnostics() {
        return {
            timestamp: new Date().toISOString(),
            recentLogs: this.getRecentLogs(20),
            summary: {
                totalRequests: this.requestLog.length,
                successRate: this.calculateSuccessRate()
            }
        };
    }

    calculateSuccessRate() {
        if (this.requestLog.length === 0) return 0;

        const responses = this.requestLog.filter(log => log.success !== undefined);
        const successes = responses.filter(log => log.success === true);

        return responses.length > 0
            ? (successes.length / responses.length * 100).toFixed(2) + '%'
            : 'N/A';
    }

    async runFullDiagnostic() {
        console.log('[InnerTube Diagnostics] 🔍 === RUNNING FULL DIAGNOSTIC ===');

        const cookies = await this.checkCookies();
        const permissions = await this.checkPermissions();
        const logs = this.exportDiagnostics();

        const report = {
            cookies,
            permissions,
            logs,
            recommendations: this.generateRecommendations(cookies, permissions)
        };

        console.log('[InnerTube Diagnostics] 📋 Full Diagnostic Report:', report);
        return report;
    }

    generateRecommendations(cookies, permissions) {
        const recommendations = [];

        if (!cookies.isLoggedIn) {
            recommendations.push({
                severity: 'HIGH',
                issue: 'User not logged into YouTube',
                solution: 'Log into YouTube in the browser to enable authenticated API access'
            });
        }

        if (!permissions.cookies) {
            recommendations.push({
                severity: 'CRITICAL',
                issue: 'Missing cookies permission',
                solution: 'Extension requires cookies permission in manifest.json'
            });
        }

        if (cookies.totalCookies === 0) {
            recommendations.push({
                severity: 'HIGH',
                issue: 'No YouTube cookies found',
                solution: 'Visit youtube.com to establish session cookies'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                severity: 'INFO',
                issue: 'No issues detected',
                solution: 'Configuration appears correct'
            });
        }

        return recommendations;
    }
}

// Singleton instance
export const diagnostics = new InnerTubeDiagnostics();
