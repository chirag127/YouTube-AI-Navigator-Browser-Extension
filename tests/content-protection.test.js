import { describe, it, expect, vi, beforeEach } from 'vitest';

global.chrome = {
    runtime: {
        getURL: p => '../../' + p,
    },
};

vi.mock('../extension/utils/shortcuts/log.js', () => ({
    e: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/storage.js', () => ({
    sg: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/global.js', () => ({
    to: vi.fn(cb => cb()),
}));

const qsMock = vi.fn();
const aeMock = vi.fn();
const reMock = vi.fn();
const ceMock = vi.fn(() => ({
    style: {},
    animate: vi.fn(),
}));

vi.mock('../extension/utils/shortcuts/dom.js', () => ({
    qs: qsMock,
    ae: aeMock,
    re: reMock,
    ce: ceMock,
}));

const { setupAutoSkip, handleAutoSkip } = await import(
    '../extension/content/segments/autoskip.js'
);
const { sg } = await import('../extension/utils/shortcuts/storage.js');

describe('Content Protection', () => {
    let videoMock;

    beforeEach(() => {
        videoMock = {
            currentTime: 0,
            playbackRate: 1,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };

        qsMock.mockImplementation(sel => {
            if (sel === 'video') return videoMock;
            return null;
        });

        aeMock.mockClear();
        reMock.mockClear();

        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: true,
                    autoSkip: true,
                    categories: {
                        sponsor: { action: 'skip', speed: 2 },
                        content: { action: 'ignore', speed: 2 },
                    },
                },
            },
        });
    });

    it('should NEVER skip Content segments', async () => {
        const segments = [
            { label: 'Sponsor', start: 0, end: 10 },
            { label: 'Content', start: 10, end: 100 },
            { label: 'Sponsor', start: 100, end: 110 },
        ];
        await setupAutoSkip(segments);

        videoMock.currentTime = 50;
        const initialTime = videoMock.currentTime;
        handleAutoSkip();

        expect(videoMock.currentTime).toBe(initialTime);
        expect(videoMock.playbackRate).toBe(1);
    });

    it('should NEVER skip Main Content segments', async () => {
        const segments = [
            { label: 'Intro', start: 0, end: 5 },
            { label: 'Main Content', start: 5, end: 200 },
            { label: 'Outro', start: 200, end: 210 },
        ];
        await setupAutoSkip(segments);

        videoMock.currentTime = 100;
        const initialTime = videoMock.currentTime;
        handleAutoSkip();

        expect(videoMock.currentTime).toBe(initialTime);
        expect(videoMock.playbackRate).toBe(1);
    });

    it('should filter out Content segments from actionable list', async () => {
        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: true,
                    autoSkip: true,
                    categories: {
                        sponsor: { action: 'skip', speed: 2 },
                        intro: { action: 'speed', speed: 2 },
                    },
                },
            },
        });

        const segments = [
            { label: 'Intro', start: 0, end: 5 },
            { label: 'Content', start: 5, end: 100 },
            { label: 'Sponsor', start: 100, end: 110 },
            { label: 'Main Content', start: 110, end: 200 },
        ];

        await setupAutoSkip(segments);

        videoMock.currentTime = 50;
        handleAutoSkip();
        expect(videoMock.currentTime).toBe(50);

        videoMock.currentTime = 150;
        handleAutoSkip();
        expect(videoMock.currentTime).toBe(150);
    });

    it('should be disabled by default', async () => {
        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: false,
                    autoSkip: false,
                    categories: {
                        sponsor: { action: 'skip', speed: 2 },
                    },
                },
            },
        });

        const segments = [{ label: 'Sponsor', start: 10, end: 20 }];
        await setupAutoSkip(segments);

        videoMock.currentTime = 15;
        handleAutoSkip();

        expect(videoMock.currentTime).toBe(15);
    });

    it('should require both enabled and autoSkip to be true', async () => {
        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: true,
                    autoSkip: false,
                    categories: {
                        sponsor: { action: 'skip', speed: 2 },
                    },
                },
            },
        });

        const segments = [{ label: 'Sponsor', start: 10, end: 20 }];
        await setupAutoSkip(segments);

        videoMock.currentTime = 15;
        handleAutoSkip();

        expect(videoMock.currentTime).toBe(15);
    });

    it('should ignore segments with action set to ignore', async () => {
        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: true,
                    autoSkip: true,
                    categories: {
                        intro: { action: 'ignore', speed: 2 },
                        outro: { action: 'ignore', speed: 2 },
                    },
                },
            },
        });

        const segments = [
            { label: 'Intermission/Intro', start: 0, end: 10 },
            { label: 'Endcards/Credits', start: 100, end: 110 },
        ];

        await setupAutoSkip(segments);

        videoMock.currentTime = 5;
        handleAutoSkip();
        expect(videoMock.currentTime).toBe(5);
        expect(videoMock.playbackRate).toBe(1);

        videoMock.currentTime = 105;
        handleAutoSkip();
        expect(videoMock.currentTime).toBe(105);
        expect(videoMock.playbackRate).toBe(1);
    });

    it('should respect minSegmentDuration filter', async () => {
        sg.mockResolvedValue({
            config: {
                segments: {
                    enabled: true,
                    autoSkip: true,
                    minSegmentDuration: 5,
                    categories: {
                        sponsor: { action: 'skip', speed: 2 },
                    },
                },
            },
        });

        const segments = [
            { label: 'Sponsor', start: 10, end: 12 },
            { label: 'Sponsor', start: 20, end: 30 },
        ];

        await setupAutoSkip(segments);

        videoMock.currentTime = 11;
        handleAutoSkip();
        expect(videoMock.currentTime).toBe(11);

        videoMock.currentTime = 25;
        handleAutoSkip();
        expect(videoMock.currentTime).toBeCloseTo(30.1, 1);
    });
});
