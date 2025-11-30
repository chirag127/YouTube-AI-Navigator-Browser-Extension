import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all dependencies
vi.mock('../../extension/utils/shortcuts/dom.js', () => ({
    ge: vi.fn(),
    on: vi.fn(),
    $$: vi.fn(() => []),
}));

vi.mock('../../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
    ss: vi.fn(),
    sls: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/core.js', () => ({
    nw: vi.fn(() => Date.now()),
    js: vi.fn(JSON.stringify),
}));

vi.mock('../../extension/utils/shortcuts/network.js', () => ({
    ft: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/chrome.js', () => ({
    cht: vi.fn(),
}));

vi.mock('../../extension/utils/shortcuts/runtime.js', () => ({
    rt: { openOptionsPage: vi.fn() },
}));

vi.mock('../../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn(),
    wn: { close: vi.fn() },
}));

vi.mock('../../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

// Mock document
global.document = {
    addEventListener: vi.fn(),
};

// Import after mocks
import { OnboardingFlow } from '../../extension/onboarding/onboarding.js';

describe('OnboardingFlow', () => {
    let instance;
    let mockGe, mockOn, mockSg, mockSs, mockSls, mockFt, mockCtab, mockRt, mockSt, mockWin, mockE;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Get mock functions
        mockGe = vi.mocked(require('../../extension/utils/shortcuts/dom.js').ge);
        mockOn = vi.mocked(require('../../extension/utils/shortcuts/dom.js').on);
        mockSg = vi.mocked(require('../../extension/utils/shortcuts/storage.js').sg);
        mockSs = vi.mocked(require('../../extension/utils/shortcuts/storage.js').ss);
        mockSls = vi.mocked(require('../../extension/utils/shortcuts/storage.js').sls);
        mockFt = vi.mocked(require('../../extension/utils/shortcuts/network.js').ft);
        mockCtab = vi.mocked(require('../../extension/utils/shortcuts/chrome.js').cht);
        mockRt = require('../../extension/utils/shortcuts/runtime.js').rt;
        mockSt = vi.mocked(require('../../extension/utils/shortcuts/global.js').to);
        mockWin = require('../../extension/utils/shortcuts/global.js').wn;
        mockE = vi.mocked(require('../../extension/utils/shortcuts/log.js').e);

        // Mock DOM elements
        const mockElement = {
            type: 'password',
            value: '',
            disabled: false,
            textContent: '',
            className: '',
            classList: {
                remove: vi.fn(),
                add: vi.fn(),
            },
            style: {},
            checked: false,
            addEventListener: vi.fn(),
        };

        mockGe.mockImplementation((id) => {
            if (id === 'apiKeyInput') return { ...mockElement, type: 'password' };
            if (id === 'testApiKeyBtn') return { ...mockElement, textContent: 'Test Connection' };
            if (id === 'apiKeyStatus') return { ...mockElement };
            if (id === 'outputLanguage') return { ...mockElement, value: 'en' };
            if (id === 'autoAnalyze') return { ...mockElement };
            if (id === 'enableSegments') return { ...mockElement };
            return mockElement;
        });

        // Mock storage
        mockSg.mockResolvedValue({ config: null });
        mockSs.mockResolvedValue();
        mockSls.mockResolvedValue();

        instance = new OnboardingFlow();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with default values', () => {
            expect(instance.currentStep).toBe(0);
            expect(instance.totalSteps).toBe(4);
            expect(instance.settings).toEqual({});
        });
    });

    describe('getDefaults', () => {
        it('should return default settings', () => {
            const defaults = instance.getDefaults();
            expect(defaults.ai.GAK).toBe('');
            expect(defaults.ai.model).toBe('gemini-2.5-flash-lite-preview-09-2025');
            expect(defaults.automation.autoAnalyze).toBe(true);
            expect(defaults.segments.enabled).toBe(true);
            expect(defaults.ui.outputLanguage).toBe('en');
            expect(defaults._meta.onboardingCompleted).toBe(false);
        });
    });

    describe('loadSettings', () => {
        it('should load settings successfully', async () => {
            const mockConfig = { ai: { GAK: 'test' } };
            mockSg.mockResolvedValue({ config: mockConfig });

            await instance.loadSettings();

            expect(mockSg).toHaveBeenCalledWith('config');
            expect(instance.settings).toEqual(mockConfig);
        });

        it('should use defaults on error', async () => {
            mockSg.mockRejectedValue(new Error('Storage error'));

            await instance.loadSettings();

            expect(mockE).toHaveBeenCalledWith('Err:LoadSettings', expect.any(Error));
            expect(instance.settings).toEqual(instance.getDefaults());
        });
    });

    describe('saveSettings', () => {
        it('should save nested settings', async () => {
            instance.settings = {};

            await instance.saveSettings('ai.GAK', 'test-key');

            expect(instance.settings.ai.GAK).toBe('test-key');
            expect(mockSs).toHaveBeenCalledWith('config', instance.settings);
        });

        it('should handle save errors', async () => {
            mockSs.mockRejectedValue(new Error('Save error'));

            await instance.saveSettings('ai.GAK', 'test');

            expect(mockE).toHaveBeenCalledWith('Err:SaveSettings', expect.any(Error));
        });
    });

    describe('toggleApiKeyVisibility', () => {
        it('should toggle input type', () => {
            const mockInput = { type: 'password' };
            mockGe.mockReturnValue(mockInput);

            instance.toggleApiKeyVisibility();

            expect(mockInput.type).toBe('text');

            instance.toggleApiKeyVisibility();

            expect(mockInput.type).toBe('password');
        });
    });

    describe('onApiKeyInput', () => {
        it('should reset status message', () => {
            const mockStatus = { className: 'error', textContent: 'error' };
            mockGe.mockImplementation((id) => {
                if (id === 'apiKeyStatus') return mockStatus;
                return {};
            });

            instance.onApiKeyInput();

            expect(mockStatus.className).toBe('status-message');
            expect(mockStatus.textContent).toBe('');
        });
    });

    describe('testApiKey', () => {
        it('should show error for empty key', async () => {
            const mockInput = { value: '' };
            const mockStatus = { className: '', textContent: '' };
            mockGe.mockImplementation((id) => {
                if (id === 'apiKeyInput') return mockInput;
                if (id === 'apiKeyStatus') return mockStatus;
                return {};
            });

            await instance.testApiKey();

            expect(mockStatus.className).toBe('status-message error');
            expect(mockStatus.textContent).toBe('Please enter an API key');
        });

        it('should handle successful API test', async () => {
            const mockInput = { value: 'test-key' };
            const mockBtn = { disabled: false, textContent: '' };
            const mockStatus = { className: '', textContent: '' };
            const mockResponse = { ok: true };
            mockGe.mockImplementation((id) => {
                if (id === 'apiKeyInput') return mockInput;
                if (id === 'testApiKeyBtn') return mockBtn;
                if (id === 'apiKeyStatus') return mockStatus;
                return {};
            });
            mockFt.mockResolvedValue(mockResponse);

            await instance.testApiKey();

            expect(mockFt).toHaveBeenCalled();
            expect(mockSs).toHaveBeenCalledWith('config', expect.any(Object));
            expect(mockSls).toHaveBeenCalledWith('GAK', 'test-key');
            expect(mockStatus.className).toBe('status-message success');
            expect(mockSt).toHaveBeenCalled();
        });

        it('should handle API test failure', async () => {
            const mockInput = { value: 'invalid-key' };
            const mockBtn = { disabled: false, textContent: '' };
            const mockStatus = { className: '', textContent: '' };
            const mockResponse = { ok: false, status: 400, statusText: 'Bad Request', json: vi.fn().mockResolvedValue({ error: { message: 'Invalid key' } }) };
            mockGe.mockImplementation((id) => {
                if (id === 'apiKeyInput') return mockInput;
                if (id === 'testApiKeyBtn') return mockBtn;
                if (id === 'apiKeyStatus') return mockStatus;
                return {};
            });
            mockFt.mockResolvedValue(mockResponse);

            await instance.testApiKey();

            expect(mockStatus.className).toBe('status-message error');
            expect(mockStatus.textContent).toBe('✗ Invalid key');
            expect(mockE).toHaveBeenCalled();
        });

        it('should handle network failure', async () => {
            const mockInput = { value: 'test-key' };
            const mockBtn = { disabled: false, textContent: '' };
            const mockStatus = { className: '', textContent: '' };
            mockGe.mockImplementation((id) => {
                if (id === 'apiKeyInput') return mockInput;
                if (id === 'testApiKeyBtn') return mockBtn;
                if (id === 'apiKeyStatus') return mockStatus;
                return {};
            });
            mockFt.mockRejectedValue(new Error('Network error'));

            await instance.testApiKey();

            expect(mockStatus.className).toBe('status-message error');
            expect(mockStatus.textContent).toBe('✗ Network error');
        });
    });

    describe('nextStep and prevStep', () => {
        it('should navigate steps', () => {
            instance.updateUI = vi.fn();

            instance.nextStep();
            expect(instance.currentStep).toBe(1);

            instance.nextStep();
            expect(instance.currentStep).toBe(2);

            instance.prevStep();
            expect(instance.currentStep).toBe(1);

            expect(instance.updateUI).toHaveBeenCalledTimes(3);
        });

        it('should not go beyond bounds', () => {
            instance.currentStep = 3;
            instance.nextStep();
            expect(instance.currentStep).toBe(3);

            instance.currentStep = 0;
            instance.prevStep();
            expect(instance.currentStep).toBe(0);
        });
    });

    describe('completeOnboarding', () => {
        it('should save completion and close window', async () => {
            await instance.completeOnboarding();

            expect(mockSs).toHaveBeenCalledWith('config', expect.objectContaining({
                _meta: { onboardingCompleted: true }
            }));
            expect(mockWin.close).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            mockSs.mockRejectedValue(new Error('Save error'));

            await instance.completeOnboarding();

            expect(mockE).toHaveBeenCalledWith('Err:CompleteOnboarding', expect.any(Error));
        });
    });
});