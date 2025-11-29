import { qs as i } from '../../utils/shortcuts/dom.js';
export class ExternalAPIs {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const a = this.s.get().externalApis || {};
    this.set('tmdbApiKey', a.tmdb || '');
    this.set('twitchClientId', a.twitchClientId || '');
    this.set('twitchAccessToken', a.twitchAccessToken || '');
    this.set('newsDataApiKey', a.newsData || '');
    this.set('googleFactCheckApiKey', a.googleFactCheck || '');
    this.a.attachToAll({
      tmdbApiKey: { path: 'externalApis.tmdb' },
      twitchClientId: { path: 'externalApis.twitchClientId' },
      twitchAccessToken: { path: 'externalApis.twitchAccessToken' },
      newsDataApiKey: { path: 'externalApis.newsData' },
      googleFactCheckApiKey: { path: 'externalApis.googleFactCheck' },
    });
  }
  set(id, v) {
    const el = i(`#${id}`);
    if (el) el.value = v;
  }
}
