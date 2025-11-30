import { qs as i } from '../../utils/shortcuts/dom.js';
export class ExternalAPIs {
  constructor(s, a) {
    this.s = s;
    this.a = a;
  }
  init() {
    const a = this.s.get().externalApis || {};
    this.set('section-tmdbApiKey', a.tmdb?.key || '');
    this.set('section-googleFactCheckApiKey', a.googleFactCheck?.key || '');
    this.set('section-sponsorBlockTimeout', a.sponsorBlock?.timeout || 5000);
    this.set('section-deArrowTimeout', a.deArrow?.timeout || 5000);
    this.a.attachToAll({
      'section-tmdbApiKey': { path: 'externalApis.tmdb.key' },
      'section-googleFactCheckApiKey': { path: 'externalApis.googleFactCheck.key' },
      'section-sponsorBlockTimeout': { path: 'externalApis.sponsorBlock.timeout' },
      'section-deArrowTimeout': { path: 'externalApis.deArrow.timeout' },
    });
  }
  set(id, v) {
    const el = i(`#${id}`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = v;
    else if (el.type === 'number') el.value = Number(v);
    else el.value = v;
  }
}
