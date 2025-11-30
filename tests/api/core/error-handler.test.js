import { describe, it, expect } from 'vitest';
import { ErrorHandler } from '../../../extension/api/core/error-handler.js';

describe('ErrorHandler', () => {
    describe('classify', () => {
        it('should classify 401 as AUTH_ERROR', () => {
            const error = { status: 401 };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('AUTH_ERROR');
            expect(result.retryable).toBe(false);
        });

        it('should classify 403 as AUTH_ERROR', () => {
            const error = { status: 403 };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('AUTH_ERROR');
        });

        it('should classify 429 as RATE_LIMIT', () => {
            const error = { status: 429 };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('RATE_LIMIT');
            expect(result.retryable).toBe(true);
        });

        it('should classify 400 as BAD_REQUEST', () => {
            const error = { status: 400 };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('BAD_REQUEST');
            expect(result.retryable).toBe(false);
        });

        it('should classify 500 as SERVER_ERROR', () => {
            const error = { status: 500 };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('SERVER_ERROR');
            expect(result.retryable).toBe(true);
        });

        it('should classify timeout', () => {
            const error = { code: 'TIMEOUT' };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('TIMEOUT');
            expect(result.retryable).toBe(true);
        });

        it('should classify network error', () => {
            const error = { message: 'Failed to fetch' };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('NETWORK_ERROR');
            expect(result.retryable).toBe(true);
        });

        it('should classify unknown error', () => {
            const error = { message: 'Unknown error' };

            const result = ErrorHandler.classify(error);

            expect(result.type).toBe('UNKNOWN_ERROR');
            expect(result.retryable).toBe(false);
        });
    });

    describe('createUserError', () => {
        it('should create user error with classified info', () => {
            const originalError = { status: 429 };
            const userError = ErrorHandler.createUserError(originalError);

            expect(userError.message).toContain('Rate limit exceeded');
            expect(userError.type).toBe('RATE_LIMIT');
            expect(userError.retryable).toBe(true);
            expect(userError.originalError).toBe(originalError);
        });
    });
});