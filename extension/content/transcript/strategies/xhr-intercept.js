import { on, of as off } from '../../../utils/shortcuts/dom.js';
import { st } from '../../../utils/shortcuts/time.js';

export const name = 'XHR Interceptor';
export const priority = 10;

export const extract = async (vid, lang = 'en') => {
  const ev = await waitForInterceptedData(vid, lang, 3000);
  if (ev?.detail?.segments) return ev.detail.segments;
  throw new Error('No intercepted transcript data');
};

const waitForInterceptedData = (vid, lang, t) =>
  new Promise(r => {
    const h = e => {
      if (e.detail?.videoId === vid || e.detail?.lang === lang) {
        off(window, 'transcriptIntercepted', h);
        r(e);
      }
    };
    on(window, 'transcriptIntercepted', h);
    st(() => {
      off(window, 'transcriptIntercepted', h);
      r(null);
    }, t);
  });
