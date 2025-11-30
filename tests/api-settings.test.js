import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsManager } from '../extension/options/modules/settings-manager.js';
describe('API Settings', () => {
    let sm;
    beforeEach(() => {
        sm = new SettingsManager();
        sm.settings = sm.getDefaults();
    });
    it('should have structured externalApis config', () => {
        const ea = sm.get('externalApis');
        expect(ea).toBeDefined();
        expect(ea.enabled).toBe(true);
    });
    it('should have all 14 API configs', () => {
        const ea = sm.get('externalApis');
        expect(ea.tmdb).toBeDefined();
        expect(ea.newsData).toBeDefined();
        expect(ea.googleFactCheck).toBeDefined();
        expect(ea.igdb).toBeDefined();
        expect(ea.musicBrainz).toBeDefined();
        expect(ea.openLibrary).toBeDefined();
        expect(ea.semanticScholar).toBeDefined();
        expect(ea.wikidata).toBeDefined();
        expect(ea.datamuse).toBeDefined();
        expect(ea.openMeteo).toBeDefined();
        expect(ea.geniusLyrics).toBeDefined();
        expect(ea.deArrow).toBeDefined();
        expect(ea.sponsorBlock).toBeDefined();
    });
    it('should have enable flags for all APIs', () => {
        const ea = sm.get('externalApis');
        expect(ea.tmdb.enabled).toBe(true);
        expect(ea.musicBrainz.enabled).toBe(true);
        expect(ea.deArrow.enabled).toBe(true);
        expect(ea.sponsorBlock.enabled).toBe(true);
    });
    it('should have API key fields for paid APIs', () => {
        const ea = sm.get('externalApis');
        expect(ea.tmdb.key).toBe('');
        expect(ea.newsData.key).toBe('');
        expect(ea.googleFactCheck.key).toBe('');
        expect(ea.igdb.clientId).toBe('');
        expect(ea.igdb.accessToken).toBe('');
    });
    it('should have timeout configs for DeArrow/SponsorBlock', () => {
        const ea = sm.get('externalApis');
        expect(ea.deArrow.timeout).toBe(5000);
        expect(ea.sponsorBlock.timeout).toBe(5000);
    });
    it('should have usePrivateAPI flag for DeArrow', () => {
        const ea = sm.get('externalApis');
        expect(ea.deArrow.usePrivateAPI).toBe(true);
    });
    it('should allow disabling individual APIs', () => {
        sm.set('externalApis.tmdb.enabled', false);
        expect(sm.get('externalApis.tmdb.enabled')).toBe(false);
        sm.set('externalApis.sponsorBlock.enabled', false);
        expect(sm.get('externalApis.sponsorBlock.enabled')).toBe(false);
    });
    it('should allow setting API keys', () => {
        sm.set('externalApis.tmdb.key', 'test-key-123');
        expect(sm.get('externalApis.tmdb.key')).toBe('test-key-123');
        sm.set('externalApis.igdb.clientId', 'client-id');
        expect(sm.get('externalApis.igdb.clientId')).toBe('client-id');
    });
    it('should allow configuring timeouts', () => {
        sm.set('externalApis.deArrow.timeout', 10000);
        expect(sm.get('externalApis.deArrow.timeout')).toBe(10000);
        sm.set('externalApis.sponsorBlock.timeout', 3000);
        expect(sm.get('externalApis.sponsorBlock.timeout')).toBe(3000);
    });
    it('should persist API settings through merge', () => {
        const loaded = {
            externalApis: {
                tmdb: { key: 'saved-key', enabled: false },
                deArrow: { enabled: false, timeout: 8000 },
            },
        };
        const merged = sm.mergeWithDefaults(loaded);
        expect(merged.externalApis.tmdb.key).toBe('saved-key');
        expect(merged.externalApis.tmdb.enabled).toBe(false);
        expect(merged.externalApis.deArrow.enabled).toBe(false);
        expect(merged.externalApis.deArrow.timeout).toBe(8000);
        expect(merged.externalApis.musicBrainz.enabled).toBe(true);
    });
});
