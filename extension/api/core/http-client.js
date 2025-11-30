import { to, co } from '../../utils/shortcuts/global.js';
import { mn } from '../../utils/shortcuts/math.js';
import { np } from '../../utils/shortcuts/async.js';

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERRORS = new Set(['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']);

export class HttpClient {
  constructor(config = {}) {
    this.maxRetries = config.maxRetries ?? 3;
    this.initialDelay = config.initialDelay ?? 1000;
    this.maxDelay = config.maxDelay ?? 10000;
    this.timeout = config.timeout ?? 30000;
  }

  async fetch(url, options = {}) {
    let lastError;
    let delay = this.initialDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = to(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        co(timeoutId);

        if (response.ok) {
          return response;
        }

        if (!RETRYABLE_STATUS.has(response.status)) {
          throw await this._createError(response);
        }

        lastError = await this._createError(response);
      } catch (error) {
        if (error.name === 'AbortError') {
          lastError = new Error(`Request timeout after ${this.timeout}ms`);
          lastError.code = 'TIMEOUT';
        } else if (RETRYABLE_ERRORS.has(error.code)) {
          lastError = error;
        } else {
          throw error;
        }
      }

      if (attempt < this.maxRetries) {
        await this._sleep(delay);
        delay = mn(delay * 2, this.maxDelay);
      }
    }

    throw lastError;
  }

  async _createError(response) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      message = data.error?.message || data.message || message;
    } catch (err) {
      void err;
    }

    const error = new Error(message);
    error.status = response.status;
    error.response = response;
    return error;
  }

  _sleep(ms) {
    return np(resolve => to(resolve, ms));
  }
}
