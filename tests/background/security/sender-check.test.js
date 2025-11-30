import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
vi.mock('../../../extension/utils/shortcuts/runtime.js', () => ({
    rt: { id: 'test-extension-id' },
}));

import {
    verifySender,
    isFromContentScript,
    isFromExtensionPage,
} from '../../../extension/background/security/sender-check.js';

describe('verifySender', () => {
    it('should return true for valid sender', () => {
        const sender = { id: 'test-extension-id', tab: { url: 'https://youtube.com/watch?v=123' } };

        const result = verifySender(sender);

        expect(result).toBe(true);
    });

    it('should return false for no sender', () => {
        const result = verifySender(null);

        expect(result).toBe(false);
    });

    it('should return false for wrong id', () => {
        const sender = { id: 'wrong-id' };

        const result = verifySender(sender);

        expect(result).toBe(false);
    });

    it('should return false for non-youtube tab', () => {
        const sender = { id: 'test-extension-id', tab: { url: 'https://example.com' } };

        const result = verifySender(sender);

        expect(result).toBe(false);
    });
});

describe('isFromContentScript', () => {
    it('should return true for content script sender', () => {
        const sender = { tab: { id: 1 }, url: 'https://youtube.com' };

        const result = isFromContentScript(sender);

        expect(result).toBe(true);
    });

    it('should return false for non-content script', () => {
        const sender = { url: 'https://example.com' };

        const result = isFromContentScript(sender);

        expect(result).toBe(false);
    });

    it('should return false for undefined sender', () => {
        const result = isFromContentScript(undefined);

        expect(result).toBe(false);
    });
});

describe('isFromExtensionPage', () => {
    it('should return true for extension page', () => {
        const sender = { url: 'chrome-extension://test-extension-id/options.html' };

        const result = isFromExtensionPage(sender);

        expect(result).toBe(true);
    });

    it('should return false for non-extension page', () => {
        const sender = { url: 'https://youtube.com' };

        const result = isFromExtensionPage(sender);

        expect(result).toBe(false);
    });
});
