import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextManager } from '../extension/services/context-manager.js';
describe('ContextManager', () => {
    let cm;
    let mockSettings;
    beforeEach(() => {
        mockSettings = {
            tmdb: { key: 'tmdb-key', enabled: true },
            newsData: { key: 'news-key', enabled: true },
            googleFactCheck: { key: 'fact-key', enabled: true },
            igdb: { clientId: 'igdb-id', accessToken: 'igdb-token', enabled: true },
            musicBrainz: { enabled: true },
            openLibrary: { enabled: true },
            semanticScholar: { enabled: true },
            wikidata: { enabled: true },
            datamuse: { enabled: true },
            openMeteo: { enabled: true },
        };
        cm = new ContextManager(mockSettings);
    });
    it('should initialize all API clients', () => {
        expect(cm.apis.tmdb).toBeDefined();
        expect(cm.apis.musicbrainz).toBeDefined();
        expect(cm.apis.igdb).toBeDefined();
        expect(cm.apis.openlibrary).toBeDefined();
        expect(cm.apis.newsdata).toBeDefined();
        expect(cm.apis.semanticscholar).toBeDefined();
        expect(cm.apis.factcheck).toBeDefined();
        expect(cm.apis.wikidata).toBeDefined();
        expect(cm.apis.datamuse).toBeDefined();
        expect(cm.apis.openmeteo).toBeDefined();
    });
    it('should pass API keys to clients', () => {
        expect(cm.apis.tmdb.apiKey).toBe('tmdb-key');
        expect(cm.apis.newsdata.apiKey).toBe('news-key');
        expect(cm.apis.factcheck.apiKey).toBe('fact-key');
        expect(cm.apis.igdb.clientId).toBe('igdb-id');
        expect(cm.apis.igdb.accessToken).toBe('igdb-token');
    });
    it('should track enabled state for all APIs', () => {
        expect(cm.enabled.tmdb).toBe(true);
        expect(cm.enabled.musicbrainz).toBe(true);
        expect(cm.enabled.wikidata).toBe(true);
    });
    it('should respect disabled APIs', () => {
        const disabledSettings = {
            ...mockSettings,
            tmdb: { key: 'key', enabled: false },
            wikidata: { enabled: false },
        };
        const cm2 = new ContextManager(disabledSettings);
        expect(cm2.enabled.tmdb).toBe(false);
        expect(cm2.enabled.wikidata).toBe(false);
        expect(cm2.enabled.musicbrainz).toBe(true);
    });
    it('should default to enabled if flag missing', () => {
        const minSettings = { tmdb: { key: 'key' } };
        const cm3 = new ContextManager(minSettings);
        expect(cm3.enabled.tmdb).toBe(true);
        expect(cm3.enabled.musicbrainz).toBe(true);
    });
    it('should handle empty settings gracefully', () => {
        const cm4 = new ContextManager({});
        expect(cm4.apis.tmdb).toBeDefined();
        expect(cm4.enabled.tmdb).toBe(true);
    });
});
