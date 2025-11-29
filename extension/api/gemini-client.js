import { HttpClient } from './core/http-client.js';
import { ErrorHandler } from './core/error-handler.js';
import { RateLimiter } from './core/rate-limiter.js';
import { l, e } from '../utils/shortcuts/log.js';
import { js } from '../utils/shortcuts/core.js';
import { isa } from '../utils/shortcuts/array.js';

export class GeminiClient {
  constructor(apiKey, config = {}) {
    this.apiKey = apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.httpClient = new HttpClient({
      maxRetries: config.maxRetries ?? 2,
      initialDelay: config.initialDelay ?? 1000,
      timeout: config.timeout ?? 30000,
    });
    this.rateLimiter = new RateLimiter({
      maxRequests: config.maxRequestsPerMinute ?? 15,
      windowMs: 60000,
    });
  }

  async generateContent(prompt, model) {
    l('ENTRY:generateContent');
    await this.rateLimiter.acquire();
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
    try {
      l(`[GC] Call: ${model}`);
      const contents = isa(prompt) ? [{ parts: prompt }] : [{ parts: [{ text: prompt }] }];
      const response = await this.httpClient.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: js({ contents }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No content');
      l('EXIT:generateContent');
      return text;
    } catch (error) {
      e(`error:generateContent ${model}:`, error.message);
      l('EXIT:generateContent');
      throw ErrorHandler.createUserError(error);
    }
  }
  getRateLimitStats() {
    l('ENTRY:getRateLimitStats');
    l('EXIT:getRateLimitStats');
    return this.rateLimiter.getStats();
  }
}
