import { describe, it, expect } from 'vitest';

describe('Shortcuts - DOM', () => {
    it('should export qs', async () => {
        const { qs } = await import('../extension/utils/shortcuts/dom.js');
        expect(qs).toBeDefined();
        expect(typeof qs).toBe('function');
    });

    it('should export $', async () => {
        const { $ } = await import('../extension/utils/shortcuts/dom.js');
        expect($).toBeDefined();
    });

    it('should export ce', async () => {
        const { ce } = await import('../extension/utils/shortcuts/dom.js');
        expect(ce).toBeDefined();
    });
});

describe('Shortcuts - Log', () => {
    it('should export l', async () => {
        const { l } = await import('../extension/utils/shortcuts/log.js');
        expect(l).toBeDefined();
        expect(typeof l).toBe('function');
    });

    it('should export e', async () => {
        const { e } = await import('../extension/utils/shortcuts/log.js');
        expect(e).toBeDefined();
    });

    it('should export w', async () => {
        const { w } = await import('../extension/utils/shortcuts/log.js');
        expect(w).toBeDefined();
    });
});

describe('Shortcuts - Core', () => {
    it('should export keys', async () => {
        const { keys } = await import('../extension/utils/shortcuts/core.js');
        expect(keys).toBe(Object.keys);
    });

    it('should export vl', async () => {
        const { vl } = await import('../extension/utils/shortcuts/core.js');
        expect(vl).toBe(Object.values);
    });

    it('should export js', async () => {
        const { js } = await import('../extension/utils/shortcuts/core.js');
        expect(js).toBe(JSON.stringify);
    });

    it('should export jp', async () => {
        const { jp } = await import('../extension/utils/shortcuts/core.js');
        expect(jp).toBe(JSON.parse);
    });
});

describe('Shortcuts - Global', () => {
    it('should export to', async () => {
        const { to } = await import('../extension/utils/shortcuts/global.js');
        expect(to).toBe(setTimeout);
    });

    it('should export co', async () => {
        const { co } = await import('../extension/utils/shortcuts/global.js');
        expect(co).toBe(clearTimeout);
    });

    it('should export jp', async () => {
        const { jp } = await import('../extension/utils/shortcuts/global.js');
        expect(jp).toBe(JSON.parse);
    });
});

describe('Shortcuts - String', () => {
    it('should export tr', async () => {
        const { tr } = await import('../extension/utils/shortcuts/string.js');
        expect(tr('  test  ')).toBe('test');
    });

    it('should export lc', async () => {
        const { lc } = await import('../extension/utils/shortcuts/string.js');
        expect(lc('TEST')).toBe('test');
    });

    it('should export uc', async () => {
        const { uc } = await import('../extension/utils/shortcuts/string.js');
        expect(uc('test')).toBe('TEST');
    });
});

describe('Shortcuts - Math', () => {
    it('should export mx', async () => {
        const { mx } = await import('../extension/utils/shortcuts/math.js');
        expect(mx).toBe(Math.max);
    });

    it('should export mn', async () => {
        const { mn } = await import('../extension/utils/shortcuts/math.js');
        expect(mn).toBe(Math.min);
    });

    it('should export fl', async () => {
        const { fl } = await import('../extension/utils/shortcuts/math.js');
        expect(fl).toBe(Math.floor);
    });
});
