/**
 * Token bucket rate limiter
 * Prevents exceeding API rate limits
 */

import { cl, cw, st, nt, mcl, prom } from "../../utils/shortcuts.js";

export class RateLimiter {
    constructor(config = {}) {
        this.maxRequests = config.maxRequests ?? 15; // Gemini free tier: 15 RPM
        this.windowMs = config.windowMs ?? 60000; // 1 minute
        this.queue = [];
        this.timestamps = [];
    }

    async acquire() {
        return prom((resolve) => {
            this.queue.push(resolve);
            this._processQueue();
        });
    }

    _processQueue() {
        if (this.queue.length === 0) return;

        const now = nt();

        // Remove timestamps outside the window
        this.timestamps = this.timestamps.filter(
            (ts) => now - ts < this.windowMs
        );

        if (this.timestamps.length < this.maxRequests) {
            this.timestamps.push(now);
            const resolve = this.queue.shift();
            resolve();

            // Process next in queue
            if (this.queue.length > 0) {
                st(() => this._processQueue(), 0);
            }
        } else {
            // Calculate wait time
            const oldestTimestamp = this.timestamps[0];
            const waitTime = this.windowMs - (now - oldestTimestamp) + 100;

            cl(
                `[RateLimiter] Rate limit reached, waiting ${mcl(
                    waitTime / 1000
                )}s`
            );

            st(() => this._processQueue(), waitTime);
        }
    }

    getStats() {
        const now = nt();
        const activeRequests = this.timestamps.filter(
            (ts) => now - ts < this.windowMs
        ).length;

        return {
            activeRequests,
            maxRequests: this.maxRequests,
            queueLength: this.queue.length,
            available: this.maxRequests - activeRequests,
        };
    }
}
