/**
 * Enhanced Gemini API client with retry, timeout, and rate limiting
 */

import { HttpClient } from "./core/http-client.js";
import { ErrorHandler } from "./core/error-handler.js";
import { RateLimiter } from "./core/rate-limiter.js";
import { cl, ce, js, st, cst } from "../utils/shortcuts.js";

export class GeminiClient {
    constructor(apiKey, config = {}) {
        this.apiKey = apiKey;
        this.baseUrl =
            config.baseUrl ||
            "https://generativelanguage.googleapis.com/v1beta";

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
        await this.rateLimiter.acquire();

        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

        try {
            cl(`[GeminiClient] Calling model: ${model}`);

            const contents = Array.isArray(prompt)
                ? [{ parts: prompt }]
                : [{ parts: [{ text: prompt }] }];

            const response = await this.httpClient.fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: js({ contents }),
            });

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("No content in response");
            }

            return text;
        } catch (error) {
            ce(`[GeminiClient] Error with model ${model}:`, error.message);
            throw ErrorHandler.createUserError(error);
        }
    }

    getRateLimitStats() {
        return this.rateLimiter.getStats();
    }
}
