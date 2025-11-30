import { ErrorHandler } from '../extension/api/core/error-handler.js';

describe('ErrorHandler', () => {
  it('should classify auth error', () => {
    const error = { status: 401 };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('AUTH_ERROR');
    expect(classified.retryable).toBe(false);
  });

  it('should classify rate limit error', () => {
    const error = { status: 429 };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('RATE_LIMIT');
    expect(classified.retryable).toBe(true);
  });

  it('should classify bad request', () => {
    const error = { status: 400 };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('BAD_REQUEST');
    expect(classified.retryable).toBe(false);
  });

  it('should classify server error', () => {
    const error = { status: 500 };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('SERVER_ERROR');
    expect(classified.retryable).toBe(true);
  });

  it('should classify timeout', () => {
    const error = { code: 'TIMEOUT' };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('TIMEOUT');
    expect(classified.retryable).toBe(true);
  });

  it('should classify network error', () => {
    const error = { message: 'Failed to fetch' };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('NETWORK_ERROR');
    expect(classified.retryable).toBe(true);
  });

  it('should create user error', () => {
    const error = { status: 401, message: 'Unauthorized' };
    const userError = ErrorHandler.createUserError(error);
    expect(userError.type).toBe('AUTH_ERROR');
    expect(userError.originalError).toBe(error);
  });

  it('should handle unknown errors', () => {
    const error = { message: 'Unknown' };
    const classified = ErrorHandler.classify(error);
    expect(classified.type).toBe('UNKNOWN_ERROR');
    expect(classified.retryable).toBe(false);
  });
});
