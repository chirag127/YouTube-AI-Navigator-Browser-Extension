import { id, on } from '../../utils/shortcuts/dom.js';
import { e } from '../../utils/shortcuts/log.js';

export class IntegrationsSettings {
  constructor(sm, nm) {
    this.sm = sm;
    this.nm = nm;
  }

  init() {
    try {
      this.loadSettings();
      this.attachListeners();
    } catch (err) {
      e('[IntegrationsSettings] Init error:', err);
    }
  }

  loadSettings() {
    try {
      const cfg = this.sm.get('integrations') || {};

      this.setCheckbox('api-datamuse-enabled', cfg.datamuse?.enabled);

      this.setCheckbox('api-google-factcheck-enabled', cfg.googleFactCheck?.enabled);
      this.setValue('api-google-factcheck-key', cfg.googleFactCheck?.apiKey);

      this.setCheckbox('api-wikidata-enabled', cfg.wikidata?.enabled);

      this.setCheckbox('api-semanticscholar-enabled', cfg.semanticScholar?.enabled);
      this.setValue('api-semanticscholar-key', cfg.semanticScholar?.apiKey);

      this.setCheckbox('api-tmdb-enabled', cfg.tmdb?.enabled);
      this.setValue('api-tmdb-key', cfg.tmdb?.apiKey);

      this.setCheckbox('api-igdb-enabled', cfg.igdb?.enabled);
      this.setValue('api-igdb-client', cfg.igdb?.clientId);
      this.setValue('api-igdb-token', cfg.igdb?.accessToken);

      this.setCheckbox('api-musicbrainz-enabled', cfg.musicbrainz?.enabled);

      this.setCheckbox('api-genius-lyrics-enabled', cfg.geniusLyrics?.enabled);
      this.setValue('api-genius-lyrics-token', cfg.geniusLyrics?.accessToken);

      this.setCheckbox('api-sponsorblock-enabled', cfg.sponsorblock?.enabled);
      this.setCheckbox('api-dearrow-enabled', cfg.dearrow?.enabled);
      this.setCheckbox('api-openmeteo-enabled', cfg.openmeteo?.enabled);

      this.setCheckbox('api-newsdata-enabled', cfg.newsdata?.enabled);
      this.setValue('api-newsdata-key', cfg.newsdata?.apiKey);

      this.setCheckbox('api-openlibrary-enabled', cfg.openlibrary?.enabled);
    } catch (err) {
      e('[IntegrationsSettings] Load error:', err);
    }
  }

  attachListeners() {
    try {
      const inputs = [
        'api-datamuse-enabled',
        'api-google-factcheck-enabled',
        'api-google-factcheck-key',
        'api-wikidata-enabled',
        'api-semanticscholar-enabled',
        'api-semanticscholar-key',
        'api-tmdb-enabled',
        'api-tmdb-key',
        'api-igdb-enabled',
        'api-igdb-client',
        'api-igdb-token',
        'api-musicbrainz-enabled',
        'api-genius-lyrics-enabled',
        'api-genius-lyrics-token',
        'api-sponsorblock-enabled',
        'api-dearrow-enabled',
        'api-openmeteo-enabled',
        'api-newsdata-enabled',
        'api-newsdata-key',
        'api-openlibrary-enabled',
      ];

      inputs.forEach(inputId => {
        const el = id(inputId);
        if (el) on(el, 'change', () => this.save());
      });
    } catch (err) {
      e('[IntegrationsSettings] Attach listeners error:', err);
    }
  }

  async save() {
    try {
      const integrations = {
        datamuse: { enabled: this.getCheckbox('api-datamuse-enabled') },
        googleFactCheck: {
          enabled: this.getCheckbox('api-google-factcheck-enabled'),
          apiKey: this.getValue('api-google-factcheck-key'),
        },
        wikidata: { enabled: this.getCheckbox('api-wikidata-enabled') },
        semanticScholar: {
          enabled: this.getCheckbox('api-semanticscholar-enabled'),
          apiKey: this.getValue('api-semanticscholar-key'),
        },
        tmdb: {
          enabled: this.getCheckbox('api-tmdb-enabled'),
          apiKey: this.getValue('api-tmdb-key'),
        },
        igdb: {
          enabled: this.getCheckbox('api-igdb-enabled'),
          clientId: this.getValue('api-igdb-client'),
          accessToken: this.getValue('api-igdb-token'),
        },
        musicbrainz: { enabled: this.getCheckbox('api-musicbrainz-enabled') },
        geniusLyrics: {
          enabled: this.getCheckbox('api-genius-lyrics-enabled'),
          accessToken: this.getValue('api-genius-lyrics-token'),
        },
        sponsorblock: { enabled: this.getCheckbox('api-sponsorblock-enabled') },
        dearrow: { enabled: this.getCheckbox('api-dearrow-enabled') },
        openmeteo: { enabled: this.getCheckbox('api-openmeteo-enabled') },
        newsdata: {
          enabled: this.getCheckbox('api-newsdata-enabled'),
          apiKey: this.getValue('api-newsdata-key'),
        },
        openlibrary: { enabled: this.getCheckbox('api-openlibrary-enabled') },
      };

      this.sm.set('integrations', integrations);
      await this.sm.save();
      this.nm.show('Integration settings saved', 'success');
    } catch (err) {
      e('[IntegrationsSettings] Save error:', err);
      this.nm.show('Failed to save integration settings', 'error');
    }
  }

  setCheckbox(elementId, value) {
    const el = id(elementId);
    if (el) el.checked = value !== false; // Default to true if undefined, or logic depending on default
  }

  getCheckbox(elementId) {
    const el = id(elementId);
    return el ? el.checked : false;
  }

  setValue(elementId, value) {
    const el = id(elementId);
    if (el) el.value = value || '';
  }

  getValue(elementId) {
    const el = id(elementId);
    return el ? el.value : '';
  }
}
